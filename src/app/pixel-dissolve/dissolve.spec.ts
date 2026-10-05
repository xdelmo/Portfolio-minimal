import { dissolvePaths, dissolveThresholds } from './dissolve';

describe('dissolveThresholds', () => {
  it('gives every cell a threshold in [0, 1)', () => {
    const t = dissolveThresholds(12, 4, 'none');
    expect(t).toHaveLength(48);
    expect([...t].every((v) => v >= 0 && v < 1)).toBe(true);
  });

  it('is the same every time, so server and browser draw the same cells', () => {
    expect([...dissolveThresholds(8, 3, 'up')]).toEqual([...dissolveThresholds(8, 3, 'up')]);
  });

  it('grows upwards: the bottom row appears before the top row on average', () => {
    const cols = 40;
    const t = dissolveThresholds(cols, 4, 'up');
    const mean = (row: number) => t.slice(row * cols, (row + 1) * cols).reduce((a, b) => a + b, 0) / cols;
    expect(mean(3)).toBeLessThan(mean(0));
  });
});

describe('dissolvePaths', () => {
  const cells = (d: string) => d.split('M').length - 1;

  it('groups the cells into stepped layers, one path per step and colour', () => {
    const paths = dissolvePaths(10, 2, 'none', 1, 4);
    expect(paths.length).toBeLessThanOrEqual(4);
    expect(paths.reduce((n, p) => n + cells(p.d), 0)).toBe(20);
    expect(paths.every((p) => p.t >= 0 && p.t < 1 && p.color === 0)).toBe(true);
    expect(paths[0].d).toMatch(/^M\d+ \d+h1v1h-1z/);
  });

  it('thins out upwards when it grows up: the bottom row is full, the top row sparse', () => {
    const cols = 40;
    const paths = dissolvePaths(cols, 3, 'up', 3, 8);
    const rowCount = (row: number) => paths.reduce((n, p) => n + (p.d.match(new RegExp(`M\\d+ ${String(row)}h`, 'g'))?.length ?? 0), 0);
    expect(rowCount(2)).toBe(cols);
    expect(rowCount(0)).toBeLessThan(cols * 0.6);
    expect(new Set(paths.map((p) => p.color)).size).toBeGreaterThan(1);
  });
});
