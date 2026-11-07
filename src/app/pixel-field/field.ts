/** Pure maths for the hero pixel field. Sizes are CSS pixels, times are milliseconds. */

/** A cloud cell: a solid square this many CSS px wide, touching its neighbours (the approved mockup's look). */
export const CLOUD_CELL = 16;
export const COMPOSE_MS = 1400;
export const POINTER_RADIUS = 96;
export const RIPPLE_MS = 1600;

/** A guard against an autoclicker: a person tapping fast leaves about ten ripples alive at once. */
export const MAX_RIPPLES = 16;

export const RIPPLE_SPEED = 0.45; // px per ms
export const RIPPLE_WIDTH = 36;

export interface FieldLayout {
  cols: number;
  rows: number;
  /** Offset of the first cell, so the grid sits centred in the canvas. */
  x0: number;
  y0: number;
}

/**
 * The cloud's grid, on the hero seam's grid (`app-pixel-dissolve`: 16px cells centred on the page, sitting on the
 * hero's foot), so the cloud's squares run on into the seam's: an even number of columns puts a cell edge on the
 * centre line, and the last row ends on the bottom edge (the top row is the one cropped).
 */
export function layout(width: number, height: number): FieldLayout {
  const cols = Math.max(2, 2 * Math.ceil(width / (2 * CLOUD_CELL)));
  const rows = Math.max(1, Math.ceil(height / CLOUD_CELL));
  return { cols, rows, x0: (width - cols * CLOUD_CELL) / 2, y0: height - rows * CLOUD_CELL };
}

/** Deterministic pseudo-random number in [0, 1). */
export function hash(n: number): number {
  const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
}

export function easeOutCubic(t: number): number {
  return 1 - (1 - Math.min(1, Math.max(0, t))) ** 3;
}

/** Each cell pulses at its own speed and phase, so the field twinkles at random. */
export function twinkle(index: number, t: number): number {
  return (Math.sin(t * (0.0006 + hash(index + 21) * 0.0018) + hash(index + 29) * Math.PI * 2) + 1) / 2;
}

/** A rectangle in CSS px, relative to the canvas. */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Cells of empty margin around the text box. */
export const CLEAR_PAD = 2;

/** How far (in depth) the cloud's edge drifts as it breathes, and how fast (period about 7 s). */
export const BREATHE = 0.08;
/** How much depth the pointer takes off the cloud at its centre: the clearing seems to widen. */
export const PULL = 0.4;
const BREATHE_SPEED = 0.0009;

/** The wind: the cloud's noise crosses the hero's width in this many seconds, redrawn at most DRIFT_FPS times a second. */
export const WIND_S = 40;
export const DRIFT_FPS = 24;

/** How many cells the cloud's noise has drifted after `t` ms on a grid `cols` wide, in DRIFT_FPS steps; 0 at rest. */
export function drift(t: number, cols: number): number {
  const step = Math.floor(Math.max(0, t) * DRIFT_FPS / 1000);
  return (step / DRIFT_FPS) * (cols / WIND_S);
}

/** Smooth value noise in [0, 1) built on `hash`. */
function noise(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const corner = (a: number, b: number): number => hash(a * 57 + b * 131 + 7);
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const top = corner(ix, iy) * (1 - sx) + corner(ix + 1, iy) * sx;
  const bottom = corner(ix, iy + 1) * (1 - sx) + corner(ix + 1, iy + 1) * sx;
  return top * (1 - sy) + bottom * sy;
}

/** The mockup's two-scale noise in [0, 1), in cell units. */
function cloudNoise(col: number, row: number): number {
  return 0.6 * noise(col / 9, row / 9) + 0.4 * noise((col + 50) / 4, (row + 50) / 4);
}

/**
 * How deep in the cloud a cell is, as in the approved mockup: a soft, noisy ellipse (radii 40% of the hero, 46% by 40%
 * on a tall one) around the text, lit where `d > 1`, with depth `min(1, (d - 1) * 1.6)`: solid blue at the edges, lavender
 * only near the rim, where a few specks (depth 0.1) also stray in. The ellipse is joined with a rounded box around `clear`
 * grown by CLEAR_PAD cells. Like andreas.vision's sky, the clearing is a soft mask, never a clip: the noise fades out over
 * 2 * CLEAR_PAD cells before the padded box, so the drifting cloud thins towards the words instead of being cut by its
 * straight edges, and the cells next to the box stay at most -BREATHE * 2.5, below anything breathing can light. `clear`
 * null (not measured yet) is a centred box of a quarter of the canvas. `shift` (cells, see `drift`) slides the noise
 * sideways: the cloud drifts with the wind while its clearing stays put.
 */
export function cloudDepth(col: number, row: number, l: FieldLayout, clear: Box | null, shift = 0): number {
  const w = l.x0 * 2 + l.cols * CLOUD_CELL;
  const h = l.y0 + l.rows * CLOUD_CELL;
  const b = clear ?? { x: w * 0.375, y: h * 0.375, w: w / 4, h: h / 4 };
  const pad = CLEAR_PAD * CLOUD_CELL;
  const mx = b.x + b.w / 2;
  const my = b.y + b.h / 2;
  const tx = b.w / 2;
  const ty = b.h / 2;
  const x = l.x0 + col * CLOUD_CELL + CLOUD_CELL / 2;
  const y = l.y0 + row * CLOUD_CELL + CLOUD_CELL / 2;
  // signed distance (px) from a rounded box of half sizes hx, hy around the text's centre: negative inside
  const box = (px: number, py: number, hx: number, hy: number, round: number): number => {
    const qx = Math.abs(px - mx) - (hx - round);
    const qy = Math.abs(py - my) - (hy - round);
    return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - round;
  };
  // the padded box: never lit, whatever the noise (the fade below keeps the cloud off its edges anyway)
  const off = box(x, y, tx + pad, ty + pad, 0);
  if (off <= 0) return -0.2;
  const tall = h > w;
  const rx0 = w * (tall ? 0.46 : 0.4);
  const ry0 = h * 0.4;
  const round = 0.6 * Math.min(tx + pad, ty + pad);
  // the mockup's ellipse, joined with the padded box (which pokes out of it where the text is wide): whichever is nearer
  const dist = (px: number, py: number): number =>
    Math.min(Math.hypot((px - mx) / rx0, (py - my) / ry0), 1 + box(px, py, tx + pad, ty + pad, round) / ry0);
  // the mockup's hero corner sits at d = 1.77: where the box pushed the edge outwards, squeeze the band so the corners still get there
  const far = Math.max(dist(0, 0), dist(w, 0), dist(0, h), dist(w, h));
  const base = 1 + (dist(x, y) - 1) * Math.max(1, 0.77 / Math.max(far - 1, 0.01));
  // the mockup's 0.7 noise, calmed far out so the corners are always solid blue, and faded out towards the text
  const near = Math.min(1, Math.max(0, off / (2 * pad)));
  const amp = 0.7 * Math.min(1, Math.max(0, (2 - base) * 2)) * near * near * (3 - 2 * near);
  const d = Math.min(base, 1 - 2.5 * BREATHE + (2.5 * BREATHE + 0.35) * off / (2 * pad)) + (cloudNoise(col - shift, row) - 0.5) * amp;
  if (d > 1) return Math.min(1, (d - 1) * 1.6);
  return d > 0.9 && near > 0.5 && hash(col * 61 + row * 17 + 5) > 0.55 ? 0.1 : d - 1;
}

/** `depth` plus a slow drift of at most BREATHE; unchanged when time is frozen (`t` 0). */
export function breathe(depth: number, phase: number, t: number): number {
  return t <= 0 ? depth : depth + BREATHE * Math.sin(t * BREATHE_SPEED + phase);
}

/** Index into the six tones (`--px-1`...`--px-6`): signal blue at the edges, lavender and sparse peach near the clearing. */
export function tone(depth: number, shade: number): number {
  if (depth > 0.75) return 0;
  if (depth > 0.5) return 1;
  if (depth > 0.3) return 2;
  return shade > 0.94 ? 5 : shade > 0.6 ? 3 : 4;
}

/** 0 before a cell appears, 1 once it is full size: the cloud grows in from its outer cells. */
export function composeIn(depth: number, t: number): number {
  const start = (1 - Math.min(1, Math.max(0, depth))) * COMPOSE_MS * 0.6;
  return Math.min(1, Math.max(0, (t - start) / (COMPOSE_MS * 0.4)));
}

/** 1 at the pointer, 0 at `radius` and beyond. */
export function falloff(distance: number, radius = POINTER_RADIUS): number {
  return distance >= radius ? 0 : (1 - distance / radius) ** 2;
}

/** Strength of a circular wave `age` ms after a tap, `distance` px from it. */
export function ripple(distance: number, age: number): number {
  if (age < 0 || age >= RIPPLE_MS) return 0;
  const ring = Math.max(0, 1 - Math.abs(distance - age * RIPPLE_SPEED) / RIPPLE_WIDTH);
  return ring * (1 - age / RIPPLE_MS);
}

/**
 * The ripples after a tap at `t`: every one still spreading keeps going, only faded ones leave (and the oldest, past
 * MAX_RIPPLES), so fast taps never cut a ring short.
 */
export function addRipple<T extends { start: number }>(ripples: readonly T[], next: T, t: number): T[] {
  return [...ripples.filter((r) => t - r.start < RIPPLE_MS), next].slice(-MAX_RIPPLES);
}

/** Time between the rings of the Konami level up, a steady beat. */
export const LEVEL_UP_GAP_MS = 150;

/**
 * The Konami level up: four rings from one point (the face's centre) on a steady beat, like a drummer's sticks
 * counting a song in.
 */
export function levelUp(centre: { x: number; y: number }, t: number): { x: number; y: number; start: number }[] {
  return [0, 1, 2, 3].map((i) => ({ ...centre, start: t + i * LEVEL_UP_GAP_MS }));
}
