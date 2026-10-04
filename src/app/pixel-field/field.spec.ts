import { CELL, COMPOSE_MS, POINTER_RADIUS, RIPPLE_MS, composeProgress, easeOutCubic, falloff, hash, layout, portraitCells, ripple, twinkle, vignette } from './field';

describe('pixel field maths', () => {
  it('fits a grid to the canvas, centres it and lays the portrait on it', () => {
    const l = layout(1000, 300, { size: 2, cells: '1004' });
    expect(l.cols).toBe(Math.floor(1000 / CELL));
    expect(l.rows).toBe(Math.floor(300 / CELL));
    expect(l.x0).toBeCloseTo((1000 - l.cols * CELL) / 2);
    expect(l.face).toHaveLength(l.cols * l.rows);
    expect(l.face.some((v) => v === 4)).toBe(true);
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

  describe('portrait', () => {
    const tiny = { size: 2, cells: '1203' };

    it('fills a centred square that fits the shorter side, sampling the portrait', () => {
      const cells = portraitCells(10, 4, tiny);
      // a 3×3 box (95% of 4 rows) centred in 10×4: columns 3–5, rows 0–2
      expect(cells.length).toBe(40);
      expect(cells[0 * 10 + 3]).toBe(1);
      expect(cells[0 * 10 + 5]).toBe(2);
      expect(cells[2 * 10 + 3]).toBe(0);
      expect(cells[2 * 10 + 5]).toBe(3);
      expect(cells[0 * 10 + 0]).toBe(0);
      expect(cells[3 * 10 + 4]).toBe(0);
    });
  });
});
