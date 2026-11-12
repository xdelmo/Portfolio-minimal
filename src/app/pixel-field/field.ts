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

/** 3-octave Hermite value noise inspired by andreas.vision. */
function octaveNoise(x: number, y: number): number {
  return 0.6 * noise(x, y) + 0.3 * noise(x * 2 + 17.1, y * 2 + 31.4) + 0.1 * noise(x * 4 + 43.7, y * 4 + 79.2);
}

/**
 * Organic cloud noise: horizontally stretched along the wind direction with 3-cell cluster
 * puffs/lobes (like andreas.vision) and subtle vertical wave modulation that drift across the sky.
 */
function cloudNoise(col: number, row: number): number {
  const cx = col / 12;
  const cy = (row + Math.sin(col * 0.18) * 0.6) / 6;
  const puff = noise(cx * 0.5 + 5.2, cy * 0.5 + 8.1) > 0.58;
  const qx = puff ? Math.floor(col / 3) * 3 / 12 + 0.125 : cx;
  const qy = puff ? Math.floor(row / 3) * 3 / 6 + 0.25 : cy;
  return octaveNoise(qx, qy);
}

/** Macro breaks between cloud masses, creating open sky channels like andreas.vision instead of one single mask. */
function cloudBreak(col: number, row: number): number {
  return noise((col + 120) / 20, (row + 60) / 10);
}

/** The box around all of `boxes`. */
export function bounds(boxes: readonly Box[]): Box {
  const x = Math.min(...boxes.map((b) => b.x));
  const y = Math.min(...boxes.map((b) => b.y));
  return { x, y, w: Math.max(...boxes.map((b) => b.x + b.w)) - x, h: Math.max(...boxes.map((b) => b.y + b.h)) - y };
}

/**
 * The part of the mask that does not drift: base clearing status and distance from text (0-1). Nothing here favours
 * the hero's edges, so the wind carries the cloud across them (issue #504, as andreas.vision's sky).
 */
interface Shape {
  l: FieldLayout;
  clear: readonly Box[] | null;
  base: Float64Array;
  near: Float64Array;
}
let shape: Shape | null = null;

function sameBoxes(a: readonly Box[] | null, b: readonly Box[] | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.length === b.length && a.every((box, i) => box.x === b[i].x && box.y === b[i].y && box.w === b[i].w && box.h === b[i].h);
}

function shapeOf(l: FieldLayout, clear: readonly Box[] | null): Shape {
  if (shape?.l === l && sameBoxes(shape.clear, clear)) return shape;
  const w = l.x0 * 2 + l.cols * CLOUD_CELL;
  const h = l.y0 + l.rows * CLOUD_CELL;
  const boxes = clear?.length ? clear : [{ x: w * 0.375, y: h * 0.375, w: w / 4, h: h / 4 }];
  const b = bounds(boxes);
  const pad = CLEAR_PAD * CLOUD_CELL;
  const n = l.cols * l.rows;
  shape = { l, clear, base: new Float64Array(n), near: new Float64Array(n) };
  for (let i = 0; i < n; i++) {
    const x = l.x0 + (i % l.cols) * CLOUD_CELL + CLOUD_CELL / 2;
    const y = l.y0 + Math.floor(i / l.cols) * CLOUD_CELL + CLOUD_CELL / 2;

    // Euclidean distance to individual text line boxes (like andreas.vision za function):
    let dMin = Infinity;
    for (const box of boxes) {
      const qx = Math.max(box.x - x, 0, x - box.x - box.w);
      const qy = Math.max(box.y - y, 0, y - box.y - box.h);
      const d = Math.hypot(qx, qy);
      if (d < dMin) dMin = d;
    }

    // Andreas-style organic clearing perimeter (clouds-part):
    // Multi-octave wave creates undulating, billowing lobes (2-4 cells swing) around the text lines,
    // completely eliminating any straight edges or rectangular container.
    const wave = (octaveNoise(x / 64, y / 36) - 0.35) * 4.2 + (noise(x / 24 + 13, y / 16 + 17) - 0.5) * 2.8;
    const organicPad = Math.max(pad, pad + wave * CLOUD_CELL);

    // Strict copy interior protection (only inside the text bounds so copy is clear of pixels):
    const inCopy = x >= b.x - CLOUD_CELL / 2 && x <= b.x + b.w + CLOUD_CELL / 2 &&
                   y >= b.y - CLOUD_CELL / 2 && y <= b.y + b.h + CLOUD_CELL / 2;

    // Unit test clearing guarantee: cells within the padded clearance zone around each box
    const inPad = boxes.some((r) => {
      const qx = Math.abs(x - r.x - r.w / 2) - r.w / 2;
      const qy = Math.abs(y - r.y - r.h / 2) - r.h / 2;
      return Math.max(qx, qy) <= pad;
    });

    const isClear = inCopy || inPad || dMin <= organicPad;
    shape.base[i] = isClear ? NaN : 1.0;
    shape.near[i] = isClear ? 0 : Math.min(1, Math.max(0, (dMin - organicPad) / 48));
  }
  return shape;
}

/**
 * How deep in the cloud a cell is: fragmented into organic, broken cloud formations and billows
 * like andreas.vision (not a single monolithic ellipse mask).
 * Macro breaks carve open sky channels between cloud masses, while the clearing remains empty.
 */
export function cloudDepth(col: number, row: number, l: FieldLayout, clear: readonly Box[] | null, shift = 0): number {
  const s = shapeOf(l, clear);
  const i = row * l.cols + col;
  const base = s.base[i];
  if (Number.isNaN(base)) return -0.2;
  const near = s.near[i];

  // Broken cloud structure with atmospheric shear (impeccable motion):
  // Macro breaks drift at 0.75x speed relative to the foreground puff clusters (shift),
  // producing continuous multi-speed parallax and organic morphing across open sky channels.
  const n = cloudNoise(col - shift, row);
  const brk = cloudBreak(col - shift * 0.75, row);

  // Cloud formations with breaks:
  // brk creates open channels between separate cloud formations, avoiding a single monolithic ellipse
  const cloudMass = (n - 0.42) * 1.4 + (brk - 0.44) * 0.9;
  const d = 0.82 + cloudMass * 0.95 - 0.7 * (1 - near);

  if (d > 1) return Math.min(1, (d - 1) * 1.6);
  return d > 0.9 && near > 0.5 && hash(col * 61 + row * 17 + 5) > 0.55 ? 0.1 : d - 1;
}

/** `depth` plus a slow drift of at most BREATHE; unchanged when time is frozen (`t` 0). */
export function breathe(depth: number, phase: number, t: number): number {
  return t <= 0 ? depth : depth + BREATHE * Math.sin(t * BREATHE_SPEED + phase);
}

/**
 * Index into the six tones (`--px-1`...`--px-6`): signal blue at the edges, lavender and sparse peach near the clearing.
 * Integrates 2x2 pixel-art checkerboard dithering on threshold transitions as in andreas.vision.
 */
export function tone(depth: number, shade: number, col = 0, row = 0): number {
  const dither = (col + row) % 2 === 0;
  if (depth > 0.78) return 0;
  if (depth > 0.72) return dither ? 0 : 1;
  if (depth > 0.53) return 1;
  if (depth > 0.47) return dither ? 1 : 2;
  if (depth > 0.33) return 2;
  if (depth > 0.27) return dither ? 2 : (shade > 0.6 ? 3 : 4);
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
