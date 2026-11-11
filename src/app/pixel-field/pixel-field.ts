import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  ErrorHandler,
  afterNextRender,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { FieldLayout, RIPPLE_MS, addRipple, bounds, layout, levelUp } from './field';
import { GAME_START } from '../game/game-start';
import { afterIntro } from '../motion/intro-state';
import { MotionPause } from '../motion/pause';
import { Paint, glPaint } from './gl';
import { FrameState, Palette, Point, drawFrame, readPalette } from './render';

const MAX_STEP_MS = 100; // a long pause between frames must not jump the animation

@Component({
  selector: 'app-pixel-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <canvas #canvas aria-hidden="true"></canvas>
  `,
  styles: `
    :host {
      position: relative;
      display: block;
    }
    // decoration in its own colours, which ignore the system palette (issue #431)
    @media (forced-colors: active) {
      :host {
        visibility: hidden;
      }
    }
    // out of flow: its pixel size must never feed back into the height of the hero rows
    canvas {
      position: absolute;
      inset: 0;
      display: block;
      width: 100%;
      height: 100%;
    }
  `,
})
export class PixelField {
  /** The element the cloud leaves clear (the hero text); without one, a box in the middle. */
  readonly clear = input<HTMLElement | null>(null);
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly animated = signal(false);
  private readonly pause = inject(MotionPause);

  private paint: Paint | null = null;
  private grid: FieldLayout | null = null;
  private palette: Palette = { dot: '', tones: [], alpha: 1 };
  private readonly frame: FrameState = { t: 0, animate: false, pointer: null, ripples: [], clear: null };
  private visible = true;
  private covered = false;
  private raf = 0;
  private last = 0;
  private readonly cleanups: (() => void)[] = [];

  constructor() {
    const errors = inject(ErrorHandler);
    afterNextRender(() => {
      try {
        this.start();
      } catch (err: unknown) {
        this.stop();
        errors.handleError(err);
      }
    });
    inject(DestroyRef).onDestroy(() => {
      this.stop();
    });
    effect(() => {
      this.frame.animate = this.animated() && !this.pause.paused();
      this.render();
      this.sync();
    });
  }

  private start(): void {
    const canvas = this.canvas().nativeElement;
    const win = window;
    const dpr = (): number => Math.min(win.devicePixelRatio || 1, 2);
    // WebGL draws every dot in one call (issue #207); canvas 2D, a fillRect per dot, where WebGL is missing
    const gl = glPaint(canvas, dpr);
    const ctx = gl ? null : canvas.getContext('2d');
    const paint: Paint | null = gl ?? (ctx && ((l, p, f) => { drawFrame(ctx, l, p, f); }));
    if (!paint) return;
    const root = document.documentElement;
    const motion = win.matchMedia('(prefers-reduced-motion: reduce)');

    const resize = (): void => {
      canvas.width = Math.round(canvas.clientWidth * dpr());
      canvas.height = Math.round(canvas.clientHeight * dpr());
      ctx?.setTransform(dpr(), 0, 0, dpr(), 0, 0);
      this.grid = layout(canvas.clientWidth, canvas.clientHeight);
      const around = this.clear();
      if (around) {
        // the text's own line boxes (and the buttons), not its container: the clearing follows the words
        const c = canvas.getBoundingClientRect();
        const rects: DOMRect[] = [...around.querySelectorAll('a, button')].map((e) => e.getBoundingClientRect());
        const walker = document.createTreeWalker(around, NodeFilter.SHOW_TEXT);
        const range = document.createRange();
        for (let n = walker.nextNode(); n; n = walker.nextNode()) {
          range.selectNodeContents(n);
          rects.push(...range.getClientRects());
        }
        const boxes = rects.filter((r) => r.width > 0 && r.height > 0).map((r) => ({ x: r.x - c.x, y: r.y - c.y, w: r.width, h: r.height }));
        if (boxes.length) {
          this.frame.clear = boxes;
          const { x, y, w, h } = bounds(boxes);
          canvas.dataset['clear'] = [x, y, w, h].map(Math.round).join();
        }
      }
      this.render();
    };
    const sizes = new ResizeObserver(resize);
    sizes.observe(canvas);
    const watched = this.clear();
    if (watched) sizes.observe(watched);
    this.cleanups.push(() => {
      sizes.disconnect();
    });

    const views = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      this.sync();
    });
    views.observe(canvas);
    this.cleanups.push(() => {
      views.disconnect();
    });

    const themes = new MutationObserver(() => {
      this.palette = readPalette(win.getComputedStyle(root));
      this.render();
    });
    themes.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    this.cleanups.push(() => {
      themes.disconnect();
    });

    const onVisibility = (): void => {
      this.sync();
    };
    const onMotion = (): void => {
      this.animated.set(!motion.matches);
    };
    const local = (e: PointerEvent): Point => {
      const box = canvas.getBoundingClientRect();
      return { x: e.clientX - box.left, y: e.clientY - box.top };
    };
    const onMove = (e: PointerEvent): void => {
      if (e.pointerType !== 'mouse') return;
      this.frame.pointer = local(e);
    };
    const onLeave = (): void => {
      this.frame.pointer = null;
    };
    const onDown = (e: PointerEvent): void => {
      if (!this.frame.animate) return;
      this.frame.ripples = addRipple(this.frame.ripples, { ...local(e), start: this.frame.t }, this.frame.t);
    };
    // the Konami code: the face counts the card in, and tells the card to wait for it, but only where it can be seen
    const onGameStart = (e: Event): void => {
      if (!this.frame.animate || !this.visible || document.hidden) return;
      const centre = { x: canvas.clientWidth / 2, y: canvas.clientHeight / 2 };
      for (const ring of levelUp(centre, this.frame.t)) this.frame.ripples = addRipple(this.frame.ripples, ring, this.frame.t);
      e.preventDefault();
    };
    document.addEventListener(GAME_START, onGameStart);
    this.cleanups.push(() => {
      document.removeEventListener(GAME_START, onGameStart);
    });
    document.addEventListener('visibilitychange', onVisibility);
    motion.addEventListener('change', onMotion);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    canvas.addEventListener('pointerdown', onDown);
    this.cleanups.push(() => {
      document.removeEventListener('visibilitychange', onVisibility);
      motion.removeEventListener('change', onMotion);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('pointerdown', onDown);
    });

    // the first visit's intro covers the hero for 2-3.6s, longer than the cloud takes to compose: its clock waits at 0
    // (nothing drawn) until the panel has gone, so the cloud composes once, with the headline (issues #369, #374).
    // The motion script ends the intro; without it, the CSS fallback's lift does
    this.covered = root.classList.contains('intro-on');
    const uncover = (): void => {
      this.covered = false;
    };
    const onLift = (e: Event): void => {
      if (e.target instanceof Element && e.target.classList.contains('site-intro')) uncover();
    };
    document.addEventListener('animationend', onLift);
    this.cleanups.push(afterIntro(uncover), () => {
      document.removeEventListener('animationend', onLift);
    });

    this.paint = paint;
    this.palette = readPalette(win.getComputedStyle(root));
    resize();
    onMotion();
  }

  private stop(): void {
    // the server destroys components too, and has no animation frames
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.cleanups.splice(0).forEach((cleanup) => {
      cleanup();
    });
    this.animated.set(false);
  }

  /** Runs the loop only while it can be seen and nobody asked it to stop. */
  private sync(): void {
    const run = this.frame.animate && this.visible && !document.hidden;
    if (run && !this.raf) {
      this.last = performance.now();
      this.raf = requestAnimationFrame(this.tick);
    } else if (!run && this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
  }

  private readonly tick = (now: number): void => {
    if (!this.covered) this.frame.t += Math.min(MAX_STEP_MS, Math.max(0, now - this.last));
    this.last = now;
    this.frame.ripples = this.frame.ripples.filter((r) => this.frame.t - r.start < RIPPLE_MS);
    this.render();
    this.raf = requestAnimationFrame(this.tick);
  };

  private render(): void {
    if (this.paint && this.grid) this.paint(this.grid, this.palette, this.frame);
  }
}
