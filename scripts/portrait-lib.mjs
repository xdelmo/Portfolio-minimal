// Pure helpers for scripts/portrait.mjs: they turn the photo into the pixel-art portrait the hero morphs into.

/** Cells per side of the portrait grid. */
export const PORTRAIT_SIZE = 40;

/**
 * Palette slot of one photo pixel: 0 is empty (the grey backdrop), 1–2 the dark clothes, beard and glasses,
 * 3–5 the skin from shadow to highlight. The slots map to colour tokens in src/app/pixel-field/render.ts.
 */
export function quantize(r, g, b) {
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  const sat = Math.max(r, g, b) - Math.min(r, g, b);
  const warm = r - b > 25;
  if (lum < 50) return 1;
  if (lum < 100) return 2;
  if (warm) return lum < 140 ? 3 : lum < 190 ? 4 : 5;
  // anything neutral and lighter than the clothes is the wall, lit or in shadow
  return sat < 22 ? 0 : 2;
}

/** One digit per cell, row by row, from PORTRAIT_SIZE² RGBA pixels. */
export function portraitString(rgba) {
  let out = '';
  for (let i = 0; i < PORTRAIT_SIZE * PORTRAIT_SIZE; i++) out += String(quantize(rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2]));
  return out;
}
