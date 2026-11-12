import { type RGB, STEPS, dither, fit, grid, luma } from './depixelate.directive';

describe('depixelate', () => {
  it('cover fills the box and crops the long side, centred', () => {
    expect(fit('cover', 300, 200, 1600, 800)).toEqual({ x: -50, y: 0, w: 400, h: 200 });
  });

  it('contain shows the whole image and letterboxes it, centred', () => {
    expect(fit('contain', 300, 200, 600, 1300)).toEqual({ x: 150 - 600 * (200 / 1300) / 2, y: 0, w: 600 * (200 / 1300), h: 200 });
  });

  it('fill (the default) stretches the image over the box', () => {
    expect(fit('fill', 160, 160, 512, 512)).toEqual({ x: 0, y: 0, w: 160, h: 160 });
  });

  it('keeps the blocks square and never asks for zero rows', () => {
    expect(grid(8, 300, 200)).toEqual({ cols: 8, rows: 5 });
    expect(grid(8, 1000, 10)).toEqual({ cols: 8, rows: 1 });
  });

  it('gets finer at every step, as on locomotive.ca', () => {
    expect([...STEPS]).toEqual([...STEPS].sort((a, b) => a - b));
    expect(STEPS[0]).toBe(8);
  });

  const ink: RGB = [29, 29, 28];
  const paper: RGB = [242, 242, 242];
  const pixels = (cols: number, rows: number, grey: number): Uint8ClampedArray =>
    new Uint8ClampedArray(cols * rows * 4).map((_, i) => (i % 4 === 3 ? 255 : grey));
  const colours = (data: Uint8ClampedArray): string[] =>
    Array.from({ length: data.length / 4 }, (_, p) => (data[p * 4] === ink[0] ? 'ink' : 'paper'));

  it('dithers to the two theme colours only, keeping alpha', () => {
    const data = pixels(4, 4, 128);
    dither(data, 4, ink, paper);
    expect(new Set(colours(data))).toEqual(new Set(['ink', 'paper']));
    expect(data.filter((_, i) => i % 4 === 3).every((a) => a === 255)).toBe(true);
  });

  it('turns black into ink and white into paper', () => {
    const black = pixels(4, 4, 0);
    const white = pixels(4, 4, 255);
    dither(black, 4, ink, paper);
    dither(white, 4, ink, paper);
    expect(colours(black).every((c) => c === 'ink')).toBe(true);
    expect(colours(white).every((c) => c === 'paper')).toBe(true);
  });

  it('inks a share of each 4 × 4 cell that follows the grey, tile after tile', () => {
    const inked = (grey: number): number => {
      const data = pixels(8, 8, grey);
      dither(data, 8, ink, paper);
      return colours(data).filter((c) => c === 'ink').length;
    };
    // a light grey (75%) inks a quarter of the pixels, mid grey half
    expect(inked(Math.round(255 * 0.75))).toBe(16);
    expect(inked(128)).toBe(32);
    expect(inked(64)).toBeGreaterThan(inked(192));
  });

  it('ranks the theme colours by luminance, so the dark theme does not invert the photo', () => {
    expect(luma(ink)).toBeLessThan(luma(paper));
    expect(luma([255, 255, 255])).toBeCloseTo(1);
  });
});
