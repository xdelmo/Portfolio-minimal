import { COMPOSE_MS, glyph, layout } from './field';
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

const palette: Palette = { glyph: '#0066d4', dot: '#1d1d1c', lit: ['#7fb2ec', '#b9d5f5', '#c9b8f5', '#a8e0c8', '#ffc9a8'] };
const grid = layout(600, 240, glyph('edm.'));
const still: FrameState = { t: 0, animate: false, pointer: null, ripples: [] };

describe('drawFrame', () => {
  it('draws one square per cell, glyph cells in the glyph colour', () => {
    const { ctx, rects } = fakeContext();
    drawFrame(ctx, grid, palette, still);
    expect(rects).toHaveLength(grid.cols * grid.rows);
    const glyphCells = grid.glyph.reduce((n, v) => n + v, 0);
    expect(rects.filter((r) => r.color === palette.glyph && r.alpha === 1)).toHaveLength(glyphCells);
  });

  it('shows the finished glyph and a calm field when not animating', () => {
    const { ctx, rects } = fakeContext();
    drawFrame(ctx, grid, palette, { ...still, t: 50 });
    const dots = rects.filter((r) => r.color !== palette.glyph);
    expect(new Set(dots.map((r) => r.color))).toEqual(new Set([palette.dot]));
  });

  it('starts with the glyph invisible and scattered when animating', () => {
    const { ctx, rects } = fakeContext();
    drawFrame(ctx, grid, palette, { ...still, animate: true, t: 0 });
    expect(rects.filter((r) => r.color === palette.glyph).every((r) => r.alpha === 0)).toBe(true);
  });

  it('lights the pixels around the pointer', () => {
    const { ctx, rects } = fakeContext();
    const pointer = { x: 30, y: 30 };
    drawFrame(ctx, grid, palette, { ...still, animate: true, t: COMPOSE_MS * 3, pointer });
    const near = rects.filter((r) => Math.hypot(r.x - pointer.x, r.y - pointer.y) < 24);
    expect(near.some((r) => palette.lit.includes(r.color))).toBe(true);
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
    expect(p).toEqual({ glyph: '#0066d4', dot: '#1d1d1c', lit: ['a', 'b', 'c', 'd', 'e'] });
  });
});
