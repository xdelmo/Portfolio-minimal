/** Pure maths for the hero pixel field. Sizes are CSS pixels, times are milliseconds. */

export const CELL = 12;
export const DOT = 8;
export const COMPOSE_MS = 1400;
export const POINTER_RADIUS = 96;
export const RIPPLE_MS = 1600;

const RIPPLE_SPEED = 0.45; // px per ms
const RIPPLE_WIDTH = 36;

export interface FieldLayout {
  cols: number;
  rows: number;
  /** Offset of the first cell, so the grid sits centred in the canvas. */
  x0: number;
  y0: number;
  /** Portrait palette slot of each cell (0 = none), indexed row * cols + col. */
  face: Uint8Array;
}

export function layout(width: number, height: number, portrait: { size: number; cells: string }): FieldLayout {
  const cols = Math.max(1, Math.floor(width / CELL));
  const rows = Math.max(1, Math.floor(height / CELL));
  return { cols, rows, x0: (width - cols * CELL) / 2, y0: (height - rows * CELL) / 2, face: portraitCells(cols, rows, portrait) };
}

/** Deterministic pseudo-random number in [0, 1). */
export function hash(n: number): number {
  const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
}

export function easeOutCubic(t: number): number {
  return 1 - (1 - Math.min(1, Math.max(0, t))) ** 3;
}

/** How far portrait cell `index` has travelled to its place, with a per-cell delay. */
export function composeProgress(index: number, t: number): number {
  const delay = hash(index) * 500;
  return easeOutCubic((t - delay) / (COMPOSE_MS - 500));
}

/** Each cell pulses at its own speed and phase, so the field twinkles at random. */
export function twinkle(index: number, t: number): number {
  return (Math.sin(t * (0.0006 + hash(index + 21) * 0.0018) + hash(index + 29) * Math.PI * 2) + 1) / 2;
}

/** 1 in the middle of the grid, easing to 0 towards its edges and corners. */
export function vignette(col: number, row: number, cols: number, rows: number): number {
  const d = Math.hypot(((col + 0.5) / cols) * 2 - 1, ((row + 0.5) / rows) * 2 - 1);
  return 1 - easeOutCubic((d - 0.45) / 0.6);
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
 * Palette slots of the portrait laid on the field: a centred square that fits the shorter side, sampled from
 * the generated grid (src/app/pixel-field/portrait.ts). 0 where the cell shows no portrait.
 */
export function portraitCells(cols: number, rows: number, portrait: { size: number; cells: string }): Uint8Array {
  const out = new Uint8Array(cols * rows);
  const n = Math.max(1, Math.floor(Math.min(cols, rows) * 0.95));
  const left = Math.floor((cols - n) / 2);
  const top = Math.floor((rows - n) / 2);
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const src = Math.floor((r * portrait.size) / n) * portrait.size + Math.floor((c * portrait.size) / n);
      out[(top + r) * cols + left + c] = Number(portrait.cells[src]);
    }
  }
  return out;
}
