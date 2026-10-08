import { CELL, LEVEL_UP_GAP_MS, MAX_RIPPLES, POINTER_RADIUS, RIPPLE_MS, addRipple, easeOutCubic, levelUp, falloff, hash, layout, ripple, twinkle, vignette } from './field';

describe('pixel field maths', () => {
  it('fits a grid of cells to the canvas and centres it, with no figure on it', () => {
    const l = layout(1000, 300);
    expect(l.cols).toBe(Math.floor(1000 / CELL));
    expect(l.rows).toBe(Math.floor(300 / CELL));
    expect(l.x0).toBeCloseTo((1000 - l.cols * CELL) / 2);
    expect(Object.keys(l).sort()).toEqual(['cols', 'rows', 'x0', 'y0']);
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

describe('adding a ripple', () => {
  const at = (start: number) => ({ start });

  it('keeps every ripple still spreading, however fast the taps come', () => {
    let ripples: { start: number }[] = [];
    for (let t = 0; t < 1000; t += 100) ripples = addRipple(ripples, at(t), t);
    expect(ripples.map((r) => r.start)).toEqual([0, 100, 200, 300, 400, 500, 600, 700, 800, 900]);
  });

  it('drops the ripples that have faded out', () => {
    expect(addRipple([at(0), at(500)], at(RIPPLE_MS + 100), RIPPLE_MS + 100).map((r) => r.start)).toEqual([500, RIPPLE_MS + 100]);
  });

  it('caps the count against an autoclicker, dropping the oldest', () => {
    let ripples: { start: number }[] = [];
    for (let t = 0; t < MAX_RIPPLES + 4; t++) ripples = addRipple(ripples, at(t), t);
    expect(ripples).toHaveLength(MAX_RIPPLES);
    expect(ripples[0].start).toBe(4);
  });
});

describe('the Konami level up', () => {
  // a drummer's count-in, sticks clicked before the song: one, two, three, four, evenly spaced
  it('sends four rings from one point, on a steady beat', () => {
    const rings = levelUp({ x: 300, y: 200 }, 1000);
    expect(rings.map((r) => r.start)).toEqual([0, 1, 2, 3].map((i) => 1000 + i * LEVEL_UP_GAP_MS));
    expect(rings.every((r) => r.x === 300 && r.y === 200)).toBe(true);
  });
});
