import { COMPOSE_MS, DOT, hash, layout, twinkle, vignette } from './field';
import { FrameState, Palette, drawFrame, readPalette } from './render';

interface Rect { x: number; y: number; size: number; alpha: number; color: string }

function fakeContext() {
  const rects: Rect[] = [];
  const ctx = {
    globalAlpha: 1,
    fillStyle: '',
    clearRect: vi.fn(),
    fillRect(x: number, y: number, w: number) {
      rects.push({ x, y, size: w, alpha: ctx.globalAlpha, color: ctx.fillStyle });
    },
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, rects };
}

const palette: Palette = {
  dot: '#1d1d1c',
  lit: ['#7fb2ec', '#b9d5f5', '#c9b8f5', '#dccff8', '#ffc9a8'],
};
const grid = layout(600, 240);
const still: FrameState = { t: 0, animate: false, pointer: null, ripples: [] };

describe('drawFrame', () => {
  it('draws one square per cell, all calm dots when nothing moves', () => {
    const { ctx, rects } = fakeContext();
    drawFrame(ctx, grid, palette, { ...still, t: 50 });
    expect(rects).toHaveLength(grid.cols * grid.rows);
    expect(new Set(rects.map((r) => r.color))).toEqual(new Set([palette.dot]));
  });

  it('lights the pixels around the pointer', () => {
    const { ctx, rects } = fakeContext();
    const pointer = { x: 30, y: 30 };
    drawFrame(ctx, grid, palette, { ...still, animate: true, t: COMPOSE_MS * 3, pointer });
    const near = rects.filter((r) => Math.hypot(r.x - pointer.x, r.y - pointer.y) < 24);
    expect(near.some((r) => palette.lit.includes(r.color))).toBe(true);
  });

  it('draws every cell as the formulas say, from the values it keeps per cell (issue #150)', () => {
    const { ctx, rects } = fakeContext();
    const t = COMPOSE_MS * 3;
    drawFrame(ctx, grid, palette, { ...still, animate: true, t });
    drawFrame(ctx, grid, palette, { ...still, animate: true, t: t + 16 }); // the second frame reads the cache
    const second = rects.slice(grid.cols * grid.rows);
    second.forEach((r, i) => {
      const e = 0.6 * twinkle(i, t + 16) ** 10;
      const col = i % grid.cols;
      const row = Math.floor(i / grid.cols);
      expect(r.size).toBeCloseTo(DOT * (0.25 + 0.75 * e), 9);
      expect(r.alpha).toBeCloseTo((0.18 + 0.82 * e) * vignette(col, row, grid.cols, grid.rows), 9);
      expect(r.color).toBe(e > 0.05 ? palette.lit[Math.floor(hash(i + 3) * palette.lit.length)] : palette.dot);
    });
  });

  it('ignores the pointer when the field is still', () => {
    const { ctx, rects } = fakeContext();
    drawFrame(ctx, grid, palette, { ...still, pointer: { x: 30, y: 30 } });
    expect(rects.some((r) => palette.lit.includes(r.color))).toBe(false);
  });
});

describe('readPalette', () => {
  it('reads the pixel colours from CSS custom properties', () => {
    const values: Record<string, string> = { '--px-1': ' #0066d4', '--fg': '#1d1d1c', '--px-2': 'a', '--px-3': 'b', '--px-4': 'c', '--px-5': 'd', '--px-6': 'e' };
    const p = readPalette({ getPropertyValue: (name: string) => values[name] });
    expect(p).toEqual({ dot: '#1d1d1c', lit: ['a', 'b', 'c', 'd', 'e'] });
  });
});
