import { STEPS, fit, grid } from './depixelate';

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
});
