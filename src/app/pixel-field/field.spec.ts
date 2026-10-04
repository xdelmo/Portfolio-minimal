import { CELL, COMPOSE_MS, POINTER_RADIUS, RIPPLE_MS, composeProgress, easeOutCubic, falloff, glyph, hash, layout, ripple, twinkle, vignette } from './field';

describe('pixel field maths', () => {
  it('builds the "edm." glyph from a 7-row bitmap font', () => {
    const g = glyph('edm.');
    expect(g.height).toBe(7);
    expect(g.width).toBe(5 + 1 + 5 + 1 + 5 + 1 + 1);
    expect(g.cells).toContainEqual([g.width - 1, 6]); // the dot sits on the baseline
    expect(g.cells.every(([x, y]) => x >= 0 && x < g.width && y >= 0 && y < 7)).toBe(true);
  });

  it('rejects characters it cannot draw', () => {
    expect(() => glyph('x')).toThrow('No pixel glyph for "x"');
  });

  it('fits a grid to the canvas and centres both grid and glyph', () => {
    const g = glyph('edm.');
    const l = layout(1000, 300, g);
    expect(l.cols).toBe(Math.floor(1000 / CELL));
    expect(l.rows).toBe(Math.floor(300 / CELL));
    expect(l.x0).toBeCloseTo((1000 - l.cols * CELL) / 2);
    expect(l.scale).toBe(2);
    const lit = [...l.glyph.keys()].filter((i) => l.glyph[i] === 1);
    expect(lit).toHaveLength(g.cells.length * l.scale * l.scale);
    const cols = lit.map((i) => i % l.cols);
    const left = Math.min(...cols);
    const right = l.cols - 1 - Math.max(...cols);
    expect(Math.abs(left - right)).toBeLessThanOrEqual(1);
  });

  it('keeps the glyph at scale 1 and inside the grid on a 320 px phone', () => {
    const l = layout(288, 192, glyph('edm.'));
    expect(l.scale).toBe(1);
    expect(l.glyph).toHaveLength(l.cols * l.rows);
  });

  it('never writes outside a grid that is smaller than the glyph', () => {
    const l = layout(100, 40, glyph('edm.'));
    expect(l.glyph).toHaveLength(l.cols * l.rows);
  });

  it('keeps hash, easing, compose and wave within [0, 1]', () => {
    for (let i = 0; i < 200; i++) {
      expect(hash(i)).toBeGreaterThanOrEqual(0);
      expect(hash(i)).toBeLessThan(1);
      const w = twinkle(i, i * 37);
      expect(w).toBeGreaterThanOrEqual(0);
      expect(w).toBeLessThanOrEqual(1);
    }
    expect(vignette(20, 10, 41, 21)).toBe(1);
    expect(vignette(0, 0, 41, 21)).toBe(0);
    expect(vignette(0, 10, 41, 21)).toBeLessThan(0.2);
    expect(easeOutCubic(-1)).toBe(0);
    expect(easeOutCubic(2)).toBe(1);
    expect(composeProgress(5, 0)).toBe(0);
    expect(composeProgress(5, COMPOSE_MS)).toBe(1);
  });

  it('pushes hardest at the pointer and not at all outside its radius', () => {
    expect(falloff(0)).toBe(1);
    expect(falloff(POINTER_RADIUS)).toBe(0);
    expect(falloff(POINTER_RADIUS * 2)).toBe(0);
    expect(falloff(10)).toBeGreaterThan(falloff(50));
  });

  it('moves the ripple ring outwards and fades it out', () => {
    const peakEarly = [0, 20, 40, 60, 80].map((d) => ripple(d, 100));
    const peakLate = [0, 200, 300, 400].map((d) => ripple(d, 700));
    expect(peakEarly.indexOf(Math.max(...peakEarly))).toBeLessThan(3);
    expect(peakLate.indexOf(Math.max(...peakLate))).toBeGreaterThan(0);
    expect(ripple(0, RIPPLE_MS)).toBe(0);
    expect(ripple(0, -1)).toBe(0);
  });
});
