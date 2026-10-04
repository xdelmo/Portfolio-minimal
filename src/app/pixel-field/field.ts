/** Pure maths for the hero pixel field. Sizes are CSS pixels, times are milliseconds. */

export const CELL = 12;
export const DOT = 8;
export const COMPOSE_MS = 1400;
export const POINTER_RADIUS = 96;
export const RIPPLE_MS = 1600;

const RIPPLE_SPEED = 0.45; // px per ms
const RIPPLE_WIDTH = 36;

// 5×7 bitmap font, lowercase sits on rows 2–6.
const FONT = new Map<string, readonly string[]>([
  ['e', ['.....', '.....', '.###.', '#...#', '#####', '#....', '.####']],
  ['d', ['....#', '....#', '.####', '#...#', '#...#', '#...#', '.####']],
  ['m', ['.....', '.....', '####.', '#.#.#', '#.#.#', '#.#.#', '#.#.#']],
  ['.', ['.', '.', '.', '.', '.', '.', '#']],
]);

export interface Glyph {
  width: number;
  height: number;
  cells: readonly (readonly [number, number])[];
}

export function glyph(text: string): Glyph {
  const cells: [number, number][] = [];
  let x = 0;
  for (const char of text) {
    const rows = FONT.get(char);
    if (!rows) throw new Error(`No pixel glyph for "${char}"`);
    rows.forEach((row, y) => {
      for (let dx = 0; dx < row.length; dx++) {
        if (row.charAt(dx) === '#') cells.push([x + dx, y]);
      }
    });
    x += Math.max(...rows.map((row) => row.length)) + 1;
  }
  return { width: x - 1, height: 7, cells };
}

export interface FieldLayout {
  cols: number;
  rows: number;
  /** Offset of the first cell, so the grid sits centred in the canvas. */
  x0: number;
  y0: number;
  scale: number;
  /** 1 where a cell belongs to the glyph, indexed row * cols + col. */
  glyph: Uint8Array;
  /** Portrait palette slot of each cell (0 = none), same indexing. */
  face: Uint8Array;
}

export function layout(width: number, height: number, g: Glyph, portrait?: { size: number; cells: string }): FieldLayout {
  const cols = Math.max(1, Math.floor(width / CELL));
  const rows = Math.max(1, Math.floor(height / CELL));
  const scale = Math.max(1, Math.floor(Math.min((cols * 0.95) / g.width, (rows * 0.7) / g.height)));
  const left = Math.floor((cols - g.width * scale) / 2);
  const top = Math.floor((rows - g.height * scale) / 2);
  const mask = new Uint8Array(cols * rows);
  for (const [gx, gy] of g.cells) {
    for (let sy = 0; sy < scale; sy++) {
      for (let sx = 0; sx < scale; sx++) {
        const col = left + gx * scale + sx;
        const row = top + gy * scale + sy;
        if (col >= 0 && col < cols && row >= 0 && row < rows) mask[row * cols + col] = 1;
      }
    }
  }
  const face = portrait ? portraitCells(cols, rows, portrait) : new Uint8Array(cols * rows);
  return { cols, rows, x0: (width - cols * CELL) / 2, y0: (height - rows * CELL) / 2, scale, glyph: mask, face };
}

/** Deterministic pseudo-random number in [0, 1). */
export function hash(n: number): number {
  const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
}

export function easeOutCubic(t: number): number {
  return 1 - (1 - Math.min(1, Math.max(0, t))) ** 3;
}

/** How far glyph cell `index` has travelled to its place, with a per-cell delay. */
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

/** How long one morph between "edm." and the face takes, and how long each scene rests. */
export const MORPH_MS = 1200;
export const SCENE_MS = { edm: 6000, face: 4000 } as const;

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

/**
 * 0 → 1 progress of cell `index` through a morph `t` ms in: cells near the middle go first and each adds its own
 * random delay, so the pixels regroup like a broken wave rather than a cross-fade.
 */
export function morphProgress(index: number, col: number, row: number, cols: number, rows: number, t: number): number {
  const fromCentre = Math.min(1, Math.hypot((col + 0.5) / cols - 0.5, (row + 0.5) / rows - 0.5) * 2);
  const delay = fromCentre * 350 + hash(index + 41) * 250;
  return easeOutCubic((t - delay) / (MORPH_MS - 600));
}

/** The scene the field shows by itself at time `t`: 0 is "edm.", 1 the face. */
export function autoScene(t: number): 0 | 1 {
  const phase = t - COMPOSE_MS;
  if (phase < SCENE_MS.edm) return 0;
  return (phase - SCENE_MS.edm) % (SCENE_MS.edm + SCENE_MS.face) < SCENE_MS.face ? 1 : 0;
}
