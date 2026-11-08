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

/** The box around all of `boxes`. */
export function bounds(boxes: readonly Box[]): Box {
  const x = Math.min(...boxes.map((b) => b.x));
  const y = Math.min(...boxes.map((b) => b.y));
  return { x, y, w: Math.max(...boxes.map((b) => b.x + b.w)) - x, h: Math.max(...boxes.map((b) => b.y + b.h)) - y };
}

/** How far (px) the text's boxes melt into one shape where they come close (a smooth minimum). */
const MELT = 48;
/** Over how much depth past the ellipse the rim's noise turns from outward only to the mockup's both ways. */
const REACH = 0.3;

/** The part of the mask that does not drift: per cell, its base depth (NaN in the padded text) and how far it is from the text (0-1). */
interface Shape {
  l: FieldLayout;
  clear: readonly Box[] | null;
  base: Float64Array;
  near: Float64Array;
}
let shape: Shape | null = null;

function shapeOf(l: FieldLayout, clear: readonly Box[] | null): Shape {
  if (shape?.l === l && shape.clear === clear) return shape;
  const w = l.x0 * 2 + l.cols * CLOUD_CELL;
  const h = l.y0 + l.rows * CLOUD_CELL;
  const boxes = clear?.length ? clear : [{ x: w * 0.375, y: h * 0.375, w: w / 4, h: h / 4 }];
  const b = bounds(boxes);
  const pad = CLEAR_PAD * CLOUD_CELL;
  const mx = b.x + b.w / 2;
  const my = b.y + b.h / 2;
  // distance (px) from the text itself: its line boxes melted together, so the clearing follows the lines, not their container
  const gap = (px: number, py: number): number => {
    let g = Infinity;
    for (const r of boxes) {
      const qx = Math.abs(px - r.x - r.w / 2) - r.w / 2;
      const qy = Math.abs(py - r.y - r.h / 2) - r.h / 2;
      const d = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0);
      const k = Math.max(MELT - Math.abs(g - d), 0) / MELT;
      g = Math.min(g, d) - k * k * MELT / 4;
    }
    return g;
  };
  // the mockup's ellipse, grown until the padded text fits inside it: its edge is never the text's outline (a rounded box)
  const a = b.w / 2 + pad;
  const c = b.h / 2 + pad;
  const rx = Math.max(w * (h > w ? 0.46 : 0.4), Math.SQRT2 * a);
  const ry = Math.max(h * 0.4, c / Math.sqrt(1 - (a / rx) ** 2));
  const dist = (px: number, py: number): number => Math.hypot((px - mx) / rx, (py - my) / ry);
  // the mockup's hero corner sits at d = 1.77: where the text pushed the edge outwards, squeeze the band so the corners still get there
  const far = Math.max(dist(0, 0), dist(w, 0), dist(0, h), dist(w, h));
  const squeeze = Math.max(1, 0.77 / Math.max(far - 1, 0.01));
  const n = l.cols * l.rows;
  shape = { l, clear, base: new Float64Array(n), near: new Float64Array(n) };
  for (let i = 0; i < n; i++) {
    const x = l.x0 + (i % l.cols) * CLOUD_CELL + CLOUD_CELL / 2;
    const y = l.y0 + Math.floor(i / l.cols) * CLOUD_CELL + CLOUD_CELL / 2;
    const g = gap(x, y);
    shape.base[i] = g <= pad ? NaN : 1 + (dist(x, y) - 1) * squeeze;
    // how far past the ellipse, not past the text: inside it the push keeps every cell dark, so the text's outline never shows
    shape.near[i] = Math.min(1, Math.max(0, (shape.base[i] - 1) / REACH));
  }
  return shape;
}

/**
 * How deep in the cloud a cell is, as in the approved mockup: a soft, noisy ellipse (radii 40% of the hero, 46% by 40%
 * on a tall one) around the text, lit where `d > 1`, with depth `min(1, (d - 1) * 1.6)`: solid blue at the edges, lavender
 * only near the rim, where a few specks (depth 0.1) also stray in. The ellipse grows until the text's own line boxes
 * (`clear`, melted together, plus CLEAR_PAD cells) fit inside it, and those are never lit. Like andreas.vision's sky
 * the rim is noise, never the text's outline: inside the ellipse the noise only pushes the cloud away (up to REACH
 * depth past it), and further out it swings both ways as in the mockup. `clear` null
 * (not measured yet) is a centred box of a quarter of the canvas. `shift` (cells, see `drift`) slides the noise
 * sideways: the cloud drifts with the wind while its clearing stays put.
 */
export function cloudDepth(col: number, row: number, l: FieldLayout, clear: readonly Box[] | null, shift = 0): number {
  const s = shapeOf(l, clear);
  const i = row * l.cols + col;
  const base = s.base[i];
  if (Number.isNaN(base)) return -0.2;
  const near = s.near[i];
  // the mockup's ±0.35 noise, outward only next to the text, calmed far out so the corners are always solid blue
  const calm = Math.min(1, Math.max(0, (2 - base) * 2));
  const d = base + ((cloudNoise(col - shift, row) - 0.5) * 0.7 - 0.35 * (1 - near)) * calm;
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

/**
 * 0 before a cell appears, 1 once it is full size: the cloud grows in from its outer cells, each one late by its own
 * `jitter` (0-1), so cells of one depth never grow in step and draw the mask's contour round the text.
 */
export function composeIn(depth: number, t: number, jitter = 0): number {
  const start = ((1 - Math.min(1, Math.max(0, depth))) * 0.3 + jitter * 0.3) * COMPOSE_MS;
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
