import { Box, CLOUD_CELL, COMPOSE_MS, PULL, FieldLayout, breathe, cloudDepth, composeIn, easeOutCubic, falloff, hash, ripple, tone } from './field';

export interface Palette {
  dot: string;
  /** `--px-1`...`--px-6`. */
  tones: readonly string[];
  /** `--cloud-alpha`: how strong the cloud is in this theme. */
  alpha: number;
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
  /** The text's clearing; null until measured. */
  clear: Box | null;
}


export function readPalette(style: Pick<CSSStyleDeclaration, 'getPropertyValue'>): Palette {
  const read = (name: string): string => style.getPropertyValue(name).trim();
  const alpha = parseFloat(read('--cloud-alpha'));
  return {
    dot: read('--fg'),
    tones: ['--px-1', '--px-2', '--px-3', '--px-4', '--px-5', '--px-6'].map(read),
    alpha: Number.isNaN(alpha) ? 1 : alpha,
  };
}

/** What each cell keeps from frame to frame: computed once per layout and clearing, since only those change it (issue #150). */
export interface Cells {
  /** Static cloud depth: at most 0 in the clearing. */
  depth: Float64Array;
  /** `twinkle`'s speed and phase (the phase also times the breathing). */
  speed: Float64Array;
  phase: Float64Array;
  /** Picks the tone among the lavender and peach ones. */
  shade: Float64Array;
}

const cache = new WeakMap<FieldLayout, { key: string; cells: Cells }>();

export function cellsOf(l: FieldLayout, clear: Box | null): Cells {
  const key = JSON.stringify(clear);
  const hit = cache.get(l);
  if (hit?.key === key) return hit.cells;
  const n = l.cols * l.rows;
  const cells: Cells = { depth: new Float64Array(n), speed: new Float64Array(n), phase: new Float64Array(n), shade: new Float64Array(n) };
  for (let i = 0; i < n; i++) {
    cells.depth[i] = cloudDepth(i % l.cols, Math.floor(i / l.cols), l, clear);
    cells.speed[i] = 0.0006 + hash(i + 21) * 0.0018;
    cells.phase[i] = hash(i + 29) * Math.PI * 2;
    cells.shade[i] = hash(i + 3);
  }
  cache.set(l, { key, cells });
  return cells;
}

export function drawFrame(ctx: CanvasRenderingContext2D, l: FieldLayout, p: Palette, f: FrameState): void {
  ctx.clearRect(0, 0, l.x0 * 2 + l.cols * CLOUD_CELL, l.y0 * 2 + l.rows * CLOUD_CELL);
  const t = f.animate ? f.t : COMPOSE_MS * 2;
  const breath = f.animate ? f.t : 0;
  const pointer = f.animate ? f.pointer : null;
  const waveIn = f.animate ? easeOutCubic((t - COMPOSE_MS) / 800) : 0;
  const cells = cellsOf(l, f.clear);
  // the browser parses fillStyle at every assignment: set it only when the colour changes
  let fill = '';

  for (let row = 0; row < l.rows; row++) {
    for (let col = 0; col < l.cols; col++) {
      const i = row * l.cols + col;
      const x = l.x0 + col * CLOUD_CELL + CLOUD_CELL / 2;
      const y = l.y0 + row * CLOUD_CELL + CLOUD_CELL / 2;
      let energy = 0;
      for (const r of f.ripples) energy = Math.max(energy, ripple(Math.hypot(x - r.x, y - r.y), t - r.start));

      // the cloud breathes both ways and the pointer pulls it back; the clearing and the holes show only ripple energy
      let depth = breathe(cells.depth[i], cells.phase[i], breath);
      if (pointer) depth -= falloff(Math.hypot(x - pointer.x, y - pointer.y)) * PULL;
      let size: number;
      let alpha: number;
      let color: string;
      if (depth > 0) {
        // twinkle(i, t), from the cached speed and phase
        const e = waveIn > 0 ? Math.max(energy, 0.6 * ((Math.sin(t * cells.speed[i] + cells.phase[i]) + 1) / 2) ** 10 * waveIn) : energy;
        const grown = composeIn(cells.depth[i], t);
        if (grown <= 0) continue;
        size = CLOUD_CELL * grown;
        alpha = p.alpha + (1 - p.alpha) * e;
        color = p.tones[tone(depth, cells.shade[i])];
      } else {
        if (energy <= 0.05) continue;
        size = CLOUD_CELL;
        alpha = energy;
        color = p.tones[tone(0, cells.shade[i])];
      }
      if (color !== fill) ctx.fillStyle = fill = color;
      ctx.globalAlpha = alpha;
      ctx.fillRect(x - size / 2, y - size / 2, size, size);
    }
  }
  ctx.globalAlpha = 1;
}
