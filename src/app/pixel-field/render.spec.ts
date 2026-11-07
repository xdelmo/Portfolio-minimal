import { COMPOSE_MS, DOT, cloudDepth, layout, tone } from './field';
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
  tones: ['#0066d4', '#7fb2ec', '#b9d5f5', '#c9b8f5', '#dccff8', '#ffc9a8'],
  alpha: 0.78,
};
const grid = layout(600, 240);
const still: FrameState = { t: 0, animate: false, pointer: null, ripples: [], clear: null };

const cloud = (i: number): boolean => cloudDepth(i % grid.cols, Math.floor(i / grid.cols), grid, null) > 0;
const cells = Array.from({ length: grid.cols * grid.rows }, (_, i) => i);

describe('drawFrame', () => {
  it('draws the cloud only, at the cloud alpha, and nothing in the clearing at rest', () => {
    const { ctx, rects } = fakeContext();
    drawFrame(ctx, grid, palette, { ...still, t: 50 });
    expect(rects).toHaveLength(cells.filter(cloud).length);
    expect(rects.length).toBeLessThan(grid.cols * grid.rows);
    expect(rects.every((r) => r.alpha === palette.alpha && r.size === DOT * 0.7)).toBe(true);
    // the first cell is a corner: the deepest blue
    expect(rects[0].color).toBe(palette.tones[tone(cloudDepth(0, 0, grid, null), 0)]);
  });

  it('draws nothing of the cloud at t = 0 and all of it by the end of the compose-in', () => {
    const none = fakeContext();
    drawFrame(none.ctx, grid, palette, { ...still, animate: true, t: 0 });
    expect(none.rects).toHaveLength(0);
    const all = fakeContext();
    drawFrame(all.ctx, grid, palette, { ...still, animate: true, t: COMPOSE_MS });
    expect(all.rects.filter((r) => r.size === DOT * 0.7).length).toBeGreaterThan(0);
    expect(all.rects.length).toBeGreaterThanOrEqual(cells.filter(cloud).length - grid.cols * grid.rows * 0.1);
  });

  it('lets pointer energy flash through the clearing', () => {
    const { ctx, rects } = fakeContext();
    const pointer = { x: 300, y: 120 };
    drawFrame(ctx, grid, palette, { ...still, animate: true, t: COMPOSE_MS * 3, pointer });
    const near = rects.filter((r) => Math.hypot(r.x - pointer.x, r.y - pointer.y) < 12);
    expect(near.some((r) => r.alpha > 0.7)).toBe(true);
  });

  it('ignores the pointer when the field is still', () => {
    const { ctx, rects } = fakeContext();
    drawFrame(ctx, grid, palette, { ...still, pointer: { x: 300, y: 120 } });
    expect(rects).toHaveLength(cells.filter(cloud).length);
  });
});

describe('readPalette', () => {
  it('reads the pixel colours from CSS custom properties', () => {
    const values: Record<string, string> = { '--px-1': ' #0066d4', '--fg': '#1d1d1c', '--px-2': 'a', '--px-3': 'b', '--px-4': 'c', '--px-5': 'd', '--px-6': 'e', '--cloud-alpha': ' 0.78' };
    const p = readPalette({ getPropertyValue: (name: string) => values[name] });
    expect(p).toEqual({ dot: '#1d1d1c', tones: ['#0066d4', 'a', 'b', 'c', 'd', 'e'], alpha: 0.78 });
  });
});
