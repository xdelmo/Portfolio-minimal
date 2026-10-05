import { CELL, COMPOSE_MS, DOT, FieldLayout, easeOutCubic, falloff, hash, ripple, twinkle, vignette } from './field';

export interface Palette {
  dot: string;
  lit: readonly string[];
}

export interface Point {
  x: number;
  y: number;
}

export interface Ripple extends Point {
  start: number;
}

export interface FrameState {
  /** Milliseconds of animation played so far. */
  t: number;
  animate: boolean;
  pointer: Point | null;
  ripples: readonly Ripple[];
}

const PUSH = 10; // px a pixel moves away from the pointer
const REST_ALPHA = 0.18;

export function readPalette(style: Pick<CSSStyleDeclaration, 'getPropertyValue'>): Palette {
  const read = (name: string): string => style.getPropertyValue(name).trim();
  return {
    dot: read('--fg'),
    lit: ['--px-2', '--px-3', '--px-4', '--px-5', '--px-6'].map(read),
  };
}

export function drawFrame(ctx: CanvasRenderingContext2D, l: FieldLayout, p: Palette, f: FrameState): void {
  ctx.clearRect(0, 0, l.x0 * 2 + l.cols * CELL, l.y0 * 2 + l.rows * CELL);
  const t = f.animate ? f.t : COMPOSE_MS * 2;
  const pointer = f.animate ? f.pointer : null;
  const waveIn = f.animate ? easeOutCubic((t - COMPOSE_MS) / 800) : 0;

  for (let row = 0; row < l.rows; row++) {
    for (let col = 0; col < l.cols; col++) {
      const i = row * l.cols + col;
      let x = l.x0 + col * CELL + CELL / 2;
      let y = l.y0 + row * CELL + CELL / 2;
      let energy = 0;

      if (pointer) {
        const dx = x - pointer.x;
        const dy = y - pointer.y;
        const d = Math.hypot(dx, dy);
        const k = falloff(d);
        if (k > 0 && d > 0) {
          x += (dx / d) * k * PUSH;
          y += (dy / d) * k * PUSH;
        }
        energy = k;
      }
      for (const r of f.ripples) energy = Math.max(energy, ripple(Math.hypot(x - r.x, y - r.y), t - r.start));

      const e = Math.max(energy, 0.6 * twinkle(i, t) ** 10 * waveIn);
      const size = DOT * (0.25 + 0.75 * e);
      ctx.globalAlpha = (REST_ALPHA + (1 - REST_ALPHA) * e) * vignette(col, row, l.cols, l.rows);
      ctx.fillStyle = e > 0.05 ? p.lit[Math.floor(hash(i + 3) * p.lit.length)] : p.dot;
      ctx.fillRect(x - size / 2, y - size / 2, size, size);
    }
  }
  ctx.globalAlpha = 1;
}
