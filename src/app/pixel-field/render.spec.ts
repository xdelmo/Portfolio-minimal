import { CLOUD_CELL, CLEAR_PAD, COMPOSE_MS, RIPPLE_MS, breathe, cloudDepth, layout, tone } from './field';
import { FrameState, Palette, cellsOf, drawFrame, readPalette } from './render';

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
    expect(rects.every((r) => r.alpha === palette.alpha && r.size === CLOUD_CELL)).toBe(true);
    // the first cell is a corner: the deepest blue
    expect(rects[0].color).toBe(palette.tones[tone(cloudDepth(0, 0, grid, null), 0)]);
  });

  it('draws nothing of the cloud at t = 0 and every lit cell at full size once composed', () => {
    const none = fakeContext();
    drawFrame(none.ctx, grid, palette, { ...still, animate: true, t: 0 });
    expect(none.rects).toHaveLength(0);
    const all = fakeContext();
    drawFrame(all.ctx, grid, palette, { ...still, animate: true, t: COMPOSE_MS });
    const c = cellsOf(grid, null);
    expect(all.rects).toHaveLength(cells.filter((i) => breathe(c.depth[i], c.phase[i], COMPOSE_MS) > 0).length);
    expect(all.rects.every((r) => r.size === CLOUD_CELL)).toBe(true);
  });

  it('pulls the cloud back from the pointer instead of lighting it', () => {
    const c = cellsOf(grid, null);
    const i = cells.find((n) => c.depth[n] > 0.15 && c.depth[n] < 0.3) ?? -1;
    expect(i).toBeGreaterThanOrEqual(0);
    const cx = grid.x0 + (i % grid.cols) * CLOUD_CELL + CLOUD_CELL / 2;
    const cy = grid.y0 + Math.floor(i / grid.cols) * CLOUD_CELL + CLOUD_CELL / 2;
    const at = (pointer: { x: number; y: number } | null): Rect[] => {
      const { ctx, rects } = fakeContext();
      drawFrame(ctx, grid, palette, { ...still, animate: true, t: COMPOSE_MS * 3, pointer });
      return rects.filter((r) => Math.abs(r.x + r.size / 2 - cx) < 1 && Math.abs(r.y + r.size / 2 - cy) < 1);
    };
    expect(at(null)).toHaveLength(1);
    expect(at({ x: cx, y: cy })).toHaveLength(0);
  });

  it('never lights the padded text box, whatever the time', () => {
    const clear = { x: 200, y: 60, w: 200, h: 120 };
    const pad = CLEAR_PAD * CLOUD_CELL;
    for (let t = 0; t < 14000; t += 500) {
      const { ctx, rects } = fakeContext();
      drawFrame(ctx, grid, palette, { ...still, animate: true, t, clear });
      for (const r of rects) {
        const x = r.x + r.size / 2;
        const y = r.y + r.size / 2;
        expect(x >= clear.x - pad && x <= clear.x + clear.w + pad && y >= clear.y - pad && y <= clear.y + clear.h + pad).toBe(false);
      }
    }
  });

  it('lets a ripple light a clearing cell, then fade', () => {
    const col = 25;
    const row = 10;
    const cx = grid.x0 + col * CLOUD_CELL + CLOUD_CELL / 2;
    const cy = grid.y0 + row * CLOUD_CELL + CLOUD_CELL / 2;
    const draw = (start: number): Rect[] => {
      const { ctx, rects } = fakeContext();
      drawFrame(ctx, grid, palette, { ...still, animate: true, t: COMPOSE_MS * 3, ripples: [{ x: cx, y: cy, start }] });
      return rects.filter((r) => Math.abs(r.x + r.size / 2 - cx) < 1 && Math.abs(r.y + r.size / 2 - cy) < 1);
    };
    expect(cloudDepth(col, row, grid, null)).toBeLessThanOrEqual(0);
    const lit = draw(COMPOSE_MS * 3);
    expect(lit).toHaveLength(1);
    expect(lit[0].alpha).toBeGreaterThan(0.9);
    expect(draw(COMPOSE_MS * 3 - RIPPLE_MS)).toHaveLength(0);
  });

  it('caches the cells per clearing', () => {
    const a = cellsOf(grid, { x: 200, y: 60, w: 200, h: 120 });
    expect(cellsOf(grid, { x: 200, y: 60, w: 200, h: 120 })).toBe(a);
    const b = cellsOf(grid, { x: 100, y: 60, w: 200, h: 120 });
    expect(b).not.toBe(a);
    expect(b.depth).not.toEqual(a.depth);
  });

  it('ignores the pointer when the field is still', () => {
    const { ctx, rects } = fakeContext();
    drawFrame(ctx, grid, palette, { ...still, pointer: { x: 300, y: 120 } });
    expect(rects).toHaveLength(cells.filter(cloud).length);
  });
});

describe('readPalette', () => {
  it('falls back to a full-strength cloud when --cloud-alpha is missing or not a number', () => {
    expect(readPalette({ getPropertyValue: () => '' }).alpha).toBe(1);
    expect(readPalette({ getPropertyValue: () => 'abc' }).alpha).toBe(1);
  });

  it('reads the pixel colours from CSS custom properties', () => {
    const values: Record<string, string> = { '--px-1': ' #0066d4', '--fg': '#1d1d1c', '--px-2': 'a', '--px-3': 'b', '--px-4': 'c', '--px-5': 'd', '--px-6': 'e', '--cloud-alpha': ' 0.78' };
    const p = readPalette({ getPropertyValue: (name: string) => values[name] });
    expect(p).toEqual({ dot: '#1d1d1c', tones: ['#0066d4', 'a', 'b', 'c', 'd', 'e'], alpha: 0.78 });
  });
});
