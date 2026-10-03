import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  ErrorHandler,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FieldLayout, RIPPLE_MS, glyph, layout } from './field';
import { FrameState, Palette, Point, drawFrame, readPalette } from './render';

const MAX_RIPPLES = 4;
const MAX_STEP_MS = 100; // a long pause between frames must not jump the animation

@Component({
  selector: 'app-pixel-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <canvas #canvas aria-hidden="true"></canvas>
    @if (animated()) {
      <button type="button" class="pause" (click)="toggle()" [attr.aria-label]="label()">
        <svg viewBox="0 0 8 8" width="16" height="16" shape-rendering="crispEdges" aria-hidden="true">
          @if (playing()) {
            <path fill="currentColor" d="M1 1h2v6H1zM5 1h2v6H5z" />
          } @else {
            <path fill="currentColor" d="M2 1h1v6H2zM3 2h1v4H3zM4 3h1v2H4zM5 3.5h1v1H5z" />
          }
        </svg>
      </button>
    }
  `,
  styles: `
    :host {
      position: relative;
      display: block;
      height: clamp(12rem, 32vw, 22rem);
    }
    canvas {
      display: block;
      width: 100%;
      height: 100%;
      touch-action: pan-y;
    }
    .pause {
      position: absolute;
      right: 0;
      bottom: 0;
      display: grid;
      place-items: center;
      width: 48px;
      height: 48px;
      padding: 0;
      border: 1px solid var(--rule);
      background: var(--bg);
      color: var(--fg);
      cursor: pointer;
    }
  `,
})
export class PixelField {
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  protected readonly animated = signal(false);
  protected readonly playing = signal(true);
  protected readonly label = computed(() =>
    this.playing()
      ? $localize`:@@field.pause:Pause the pixel animation`
      : $localize`:@@field.play:Play the pixel animation`,
  );

  private ctx: CanvasRenderingContext2D | null = null;
  private grid: FieldLayout | null = null;
  private palette: Palette = { glyph: '', dot: '', lit: [] };
  private readonly frame: FrameState & { ripples: FrameState['ripples'] } = { t: 0, animate: false, pointer: null, ripples: [] };
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
  }

  protected toggle(): void {
    this.playing.update((playing) => !playing);
    this.frame.animate = this.playing();
    this.render();
    this.sync();
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
      this.grid = layout(canvas.clientWidth, canvas.clientHeight, text);
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
      this.frame.animate = this.animated() && this.playing();
      this.render();
      this.sync();
    };
    const local = (e: PointerEvent): Point => {
      const box = canvas.getBoundingClientRect();
      return { x: e.clientX - box.left, y: e.clientY - box.top };
    };
    const onMove = (e: PointerEvent): void => {
      if (e.pointerType === 'mouse') this.frame.pointer = local(e);
    };
    const onLeave = (): void => {
      this.frame.pointer = null;
    };
    const onDown = (e: PointerEvent): void => {
      if (!this.frame.animate) return;
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
    this.render();
    this.raf = requestAnimationFrame(this.tick);
  };

  private render(): void {
    if (this.ctx && this.grid) drawFrame(this.ctx, this.grid, this.palette, this.frame);
  }
}
