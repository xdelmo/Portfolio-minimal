/** Pure maths for the photos that load depixelating, as on locomotive.ca (issue #157). Sizes are CSS pixels. */

/** Blocks across the photo at each step, one step every STEP_MS; after the last one the photo itself shows. */
export const STEPS = [8, 16, 32, 48, 96, 128] as const;
export const STEP_MS = 100;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Where `object-fit` draws an image of `iw` × `ih` inside a box of `bw` × `bh` (cover crops, contain letterboxes). */
export function fit(mode: string, bw: number, bh: number, iw: number, ih: number): Rect {
  if (mode !== 'cover' && mode !== 'contain') return { x: 0, y: 0, w: bw, h: bh };
  const scale = mode === 'cover' ? Math.max(bw / iw, bh / ih) : Math.min(bw / iw, bh / ih);
  const w = iw * scale;
  const h = ih * scale;
  return { x: (bw - w) / 2, y: (bh - h) / 2, w, h };
}

/** The canvas of one step: `cols` blocks across the box, square blocks, so as many rows as the box's shape asks. */
export function grid(cols: number, bw: number, bh: number): { cols: number; rows: number } {
  return { cols, rows: Math.max(1, Math.round((cols * bh) / bw)) };
}
