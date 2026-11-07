/** Pure maths for the hero pixel field. Sizes are CSS pixels, times are milliseconds. */

export const CELL = 12;
export const DOT = 8;
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

export function layout(width: number, height: number): FieldLayout {
  const cols = Math.max(1, Math.floor(width / CELL));
  const rows = Math.max(1, Math.floor(height / CELL));
  return { cols, rows, x0: (width - cols * CELL) / 2, y0: (height - rows * CELL) / 2 };
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

/**
 * How deep in the cloud a cell is: at most -2 * BREATHE inside the clearing (the ellipse around `clear`, grown by CLEAR_PAD cells,
 * which covers the padded box), rising to 1 towards the hero's corners, its edge roughened by noise. `clear` null (not
 * measured yet) is a centred box of half the canvas, so nothing lands on the centre.
 */
export function cloudDepth(col: number, row: number, l: FieldLayout, clear: Box | null): number {
  const w = l.x0 * 2 + l.cols * CELL;
  const h = l.y0 * 2 + l.rows * CELL;
  const b = clear ?? { x: w / 4, y: h / 4, w: w / 2, h: h / 2 };
  const mx = b.x + b.w / 2;
  const my = b.y + b.h / 2;
  const rx = (b.w / 2 + CLEAR_PAD * CELL) * Math.SQRT2 * 1.001;
  const ry = (b.h / 2 + CLEAR_PAD * CELL) * Math.SQRT2 * 1.001;
  const dist = (px: number, py: number): number => Math.hypot((px - mx) / rx, (py - my) / ry);
  const d = dist(l.x0 + col * CELL + CELL / 2, l.y0 + row * CELL + CELL / 2);
  // 2 * BREATHE below zero, so breathing can never light a cell of the padded box
  if (d <= 1) return d - 1 - 2 * BREATHE;
  const far = Math.max(dist(0, 0), dist(w, 0), dist(0, h), dist(w, h));
  const base = (d - 1) / Math.max(far - 1, 0.01);
  return Math.min(1, base + (noise(col / 4, row / 4) - 0.5) * 0.3);
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
  return shade > 0.85 ? 5 : shade > 0.45 ? 3 : 4;
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
