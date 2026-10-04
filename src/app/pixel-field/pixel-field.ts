import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  ErrorHandler,
  afterNextRender,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FieldLayout, MORPH_MS, RIPPLE_MS, SCENE_MS, autoScene, glyph, layout } from './field';
import { PORTRAIT } from './portrait';
import { MotionPause } from '../motion/pause';
import { FrameState, Palette, Point, drawFrame, readPalette } from './render';

const MAX_RIPPLES = 4;
const MAX_STEP_MS = 100; // a long pause between frames must not jump the animation

@Component({
  selector: 'app-pixel-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-scene]': "scene() === 1 ? 'face' : 'edm'" },
  template: `
    <canvas #canvas aria-hidden="true"></canvas>
  `,
  styles: `
    :host {
      position: relative;
      display: block;
      height: clamp(12rem, 32vw, 22rem);
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
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly animated = signal(false);
  /** 0 "edm.", 1 the face: what the field is showing or heading to. */
  protected readonly scene = signal<0 | 1>(0);
  private readonly pause = inject(MotionPause);

  private ctx: CanvasRenderingContext2D | null = null;
  private grid: FieldLayout | null = null;
  private palette: Palette = { glyph: '', dot: '', lit: [], face: [] };
  // starts settled on "edm.": its last morph ended before the clock began
  private readonly frame: FrameState = { t: 0, animate: false, pointer: null, ripples: [], scene: { to: 0, start: -MORPH_MS } };
  private hovering = false;
  /** A click or a tap picks the scene for a while, then the field goes back to its own cycle. */
  private chosen: { scene: 0 | 1; until: number } | null = null;
  private visible = true;
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
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const win = window;
    const root = document.documentElement;
    const text = glyph('edm.');
    const motion = win.matchMedia('(prefers-reduced-motion: reduce)');

    const resize = (): void => {
      const dpr = Math.min(win.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.grid = layout(canvas.clientWidth, canvas.clientHeight, text, PORTRAIT);
      this.render();
    };
    const sizes = new ResizeObserver(resize);
    sizes.observe(canvas);
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
      this.hovering = true;
    };
    const onLeave = (): void => {
      this.frame.pointer = null;
      this.hovering = false;
      this.chosen = null;
    };
    const onDown = (e: PointerEvent): void => {
      const next = this.frame.scene.to === 1 ? 0 : 1;
      this.chosen = { scene: next, until: this.frame.t + SCENE_MS.edm };
      if (!this.frame.animate) {
        // still field: swap at once, without the morph
        this.show(next, this.frame.t - MORPH_MS);
        this.render();
        return;
      }
      this.show(next, this.frame.t);
      this.frame.ripples = [...this.frame.ripples.slice(1 - MAX_RIPPLES), { ...local(e), start: this.frame.t }];
    };
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

    this.ctx = ctx;
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
    this.frame.t += Math.min(MAX_STEP_MS, Math.max(0, now - this.last));
    this.last = now;
    this.frame.ripples = this.frame.ripples.filter((r) => this.frame.t - r.start < RIPPLE_MS);
    const { t, scene } = this.frame;
    if (this.chosen && t >= this.chosen.until && !this.hovering) this.chosen = null;
    const target = this.chosen?.scene ?? (this.hovering ? 1 : autoScene(t));
    // one morph at a time: a new target waits for the current morph to land
    if (target !== scene.to && t - scene.start >= MORPH_MS) this.show(target, t);
    this.render();
    this.raf = requestAnimationFrame(this.tick);
  };

  private show(scene: 0 | 1, start: number): void {
    this.frame.scene = { to: scene, start };
    this.scene.set(scene);
  }

  private render(): void {
    if (this.ctx && this.grid) drawFrame(this.ctx, this.grid, this.palette, this.frame);
  }
}
