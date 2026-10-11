import { CELL, COMPOSE_MS, DOT, FieldLayout, easeOutCubic, falloff, hash, ripple, vignette } from './field';

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

/** What each cell keeps from frame to frame: computed once per layout, since only a resize changes it (issue #150). */
interface Cells {
  vignette: Float64Array;
  /** `twinkle`'s speed and phase. */
  speed: Float64Array;
  phase: Float64Array;
  /** Index into the palette's lit colours. */
  lit: Float64Array;
}

const cache = new WeakMap<FieldLayout, Cells>();

function cellsOf(l: FieldLayout): Cells {
  let cells = cache.get(l);
  if (cells) return cells;
  const n = l.cols * l.rows;
  cells = { vignette: new Float64Array(n), speed: new Float64Array(n), phase: new Float64Array(n), lit: new Float64Array(n) };
  for (let i = 0; i < n; i++) {
    cells.vignette[i] = vignette(i % l.cols, Math.floor(i / l.cols), l.cols, l.rows);
    cells.speed[i] = 0.0006 + hash(i + 21) * 0.0018;
    cells.phase[i] = hash(i + 29) * Math.PI * 2;
    cells.lit[i] = hash(i + 3);
  }
  cache.set(l, cells);
  return cells;
}

export function drawFrame(ctx: CanvasRenderingContext2D, l: FieldLayout, p: Palette, f: FrameState): void {
  ctx.clearRect(0, 0, l.x0 * 2 + l.cols * CELL, l.y0 * 2 + l.rows * CELL);
  const t = f.animate ? f.t : COMPOSE_MS * 2;
  const pointer = f.animate ? f.pointer : null;
  const waveIn = f.animate ? easeOutCubic((t - COMPOSE_MS) / 800) : 0;
  const cells = cellsOf(l);
  // the browser parses fillStyle at every assignment: set it only when the colour changes
  let fill = '';

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

      // twinkle(i, t), from the cached speed and phase
      const e = waveIn > 0 ? Math.max(energy, 0.6 * ((Math.sin(t * cells.speed[i] + cells.phase[i]) + 1) / 2) ** 10 * waveIn) : energy;
      const size = DOT * (0.25 + 0.75 * e);
      const color = e > 0.05 ? p.lit[Math.floor(cells.lit[i] * p.lit.length)] : p.dot;
      if (color !== fill) ctx.fillStyle = fill = color;
      ctx.globalAlpha = (REST_ALPHA + (1 - REST_ALPHA) * e) * cells.vignette[i];
      ctx.fillRect(x - size / 2, y - size / 2, size, size);
    }
  }
  ctx.globalAlpha = 1;
}
