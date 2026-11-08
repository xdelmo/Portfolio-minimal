import { CLOUD_CELL, LEVEL_UP_GAP_MS, MAX_RIPPLES, POINTER_RADIUS, RIPPLE_MS, addRipple, easeOutCubic, levelUp, falloff, hash, layout, ripple, twinkle, BREATHE, CLEAR_PAD, DRIFT_FPS, WIND_S, breathe, cloudDepth, drift, tone } from './field';

describe('pixel field maths', () => {
  it('covers the canvas on the hero seam\'s grid: a cell edge on the centre line, the last row on the bottom edge', () => {
    for (const [w, h] of [[1000, 300], [1440, 804], [390, 780], [375, 603], [1023, 777]]) {
      const l = layout(w, h);
      expect(l.x0).toBeLessThanOrEqual(0);
      expect(l.x0 + l.cols * CLOUD_CELL).toBeGreaterThanOrEqual(w);
      expect(l.y0).toBeLessThanOrEqual(0);
      expect(l.y0 + l.rows * CLOUD_CELL).toBe(h);
      expect((w / 2 - l.x0) % CLOUD_CELL).toBe(0);
    }
    expect(Object.keys(layout(1000, 300)).sort()).toEqual(['cols', 'rows', 'x0', 'y0']);
  });

  it('keeps hash, easing, compose and wave within [0, 1]', () => {
    for (let i = 0; i < 200; i++) {
      expect(hash(i)).toBeGreaterThanOrEqual(0);
      expect(hash(i)).toBeLessThan(1);
      const w = twinkle(i, i * 37);
      expect(w).toBeGreaterThanOrEqual(0);
      expect(w).toBeLessThanOrEqual(1);
    }
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

describe('the cloud mask', () => {
  const l = layout(1200, 720);
  const clear = { x: 400, y: 240, w: 400, h: 240 };

  it('cloudDepth leaves the padded clearing empty', () => {
    const pad = CLEAR_PAD * CLOUD_CELL;
    for (let i = 0; i < l.cols * l.rows; i++) {
      const col = i % l.cols;
      const row = Math.floor(i / l.cols);
      const x = l.x0 + col * CLOUD_CELL + CLOUD_CELL / 2;
      const y = l.y0 + row * CLOUD_CELL + CLOUD_CELL / 2;
      if (x >= clear.x - pad && x <= clear.x + clear.w + pad && y >= clear.y - pad && y <= clear.y + clear.h + pad) {
        expect(cloudDepth(col, row, l, [clear])).toBeLessThanOrEqual(-2 * BREATHE);
      }
    }
  });

  it("cloudDepth is deepest at the hero's corners", () => {
    for (const [c, r] of [[0, 0], [l.cols - 1, 0], [0, l.rows - 1], [l.cols - 1, l.rows - 1]]) {
      expect(cloudDepth(c, r, l, [clear])).toBeGreaterThan(0.75);
    }
    expect(cloudDepth(0, 0, l, null)).toBeGreaterThan(0.75);
  });

  it('lights a wide share of a desktop hero, with cloud on all four sides', () => {
    const big = layout(1440, 900);
    const text = { x: 340, y: 290, w: 760, h: 320 };
    let lit = 0;
    const strips = { left: 0, right: 0, top: 0, bottom: 0 };
    for (let i = 0; i < big.cols * big.rows; i++) {
      const col = i % big.cols;
      const row = Math.floor(i / big.cols);
      if (cloudDepth(col, row, big, [text]) <= 0) continue;
      lit++;
      if (col < big.cols * 0.1) strips.left++;
      if (col >= big.cols * 0.9) strips.right++;
      if (row < big.rows * 0.1) strips.top++;
      if (row >= big.rows * 0.9) strips.bottom++;
    }
    expect(lit / (big.cols * big.rows)).toBeGreaterThanOrEqual(0.25);
    for (const n of Object.values(strips)) expect(n).toBeGreaterThan(0);
    expect(cloudDepth(0, 0, big, [text])).toBeGreaterThan(0.75);
  });

  it('the drifting cloud never lights the padded clearing', () => {
    const pad = CLEAR_PAD * CLOUD_CELL;
    for (const shift of [0.37, 5.5, 41, 900]) {
      for (let i = 0; i < l.cols * l.rows; i++) {
        const col = i % l.cols;
        const row = Math.floor(i / l.cols);
        const x = l.x0 + col * CLOUD_CELL + CLOUD_CELL / 2;
        const y = l.y0 + row * CLOUD_CELL + CLOUD_CELL / 2;
        if (x >= clear.x - pad && x <= clear.x + clear.w + pad && y >= clear.y - pad && y <= clear.y + clear.h + pad) {
          expect(cloudDepth(col, row, l, [clear], shift)).toBeLessThanOrEqual(-2 * BREATHE);
        }
      }
    }
  });

  it('the noise drifts with the wind: a shift moves the cloud sideways', () => {
    let moved = 0;
    for (let i = 0; i < l.cols * l.rows; i++) {
      const col = i % l.cols;
      const row = Math.floor(i / l.cols);
      if (cloudDepth(col, row, l, [clear], 3) !== cloudDepth(col, row, l, [clear])) moved++;
    }
    expect(moved).toBeGreaterThan(0);
  });

  it('drift crosses the grid every WIND_S seconds, in DRIFT_FPS steps, and is 0 at rest', () => {
    expect(drift(0, 90)).toBe(0);
    expect(drift(WIND_S * 1000, 90)).toBeCloseTo(90);
    expect(drift(1000 / DRIFT_FPS - 1, 90)).toBe(0);
    expect(drift(1000 / DRIFT_FPS + 1, 90)).toBeGreaterThan(0);
    expect(drift(-50, 90)).toBe(0);
  });

  it('cloudDepth is deterministic', () => {
    expect(cloudDepth(7, 9, l, [clear])).toBe(cloudDepth(7, 9, l, [clear]));
  });

  it('breathe drifts at most 0.08, and not at all when time is frozen', () => {
    for (let i = 0; i < 200; i++) expect(Math.abs(breathe(0.5, 1.3, i * 997) - 0.5)).toBeLessThanOrEqual(0.08 + 1e-12);
    expect(breathe(0.5, 1.3, 0)).toBe(0.5);
  });

  it('tone maps depth to the six tones', () => {
    expect(tone(0.9, 0)).toBe(0);
    expect(tone(0.6, 0)).toBe(1);
    expect(tone(0.4, 0)).toBe(2);
    expect(tone(0.1, 0.97)).toBe(5);
    expect([3, 4]).toContain(tone(0.1, 0.2));
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
