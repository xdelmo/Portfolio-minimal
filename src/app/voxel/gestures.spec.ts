import { describe, expect, it } from 'vitest';
import { isDizzy, isShake, isSneeze, isTickle } from './gestures';

/** Strokes of `size` px back and forth, `step` ms apart, starting at 0. */
function strokes(count: number, size: number, step = 100) {
  return Array.from({ length: count + 1 }, (_, i) => ({ t: i * step, v: i % 2 ? size : 0 }));
}

describe('isShake', () => {
  it('needs four changes of direction', () => {
    expect(isShake(strokes(4, 60))).toBe(false);
    expect(isShake(strokes(5, 60))).toBe(true);
  });

  it('ignores strokes under 30 px', () => {
    expect(isShake(strokes(8, 29))).toBe(false);
    expect(isShake(strokes(8, 30))).toBe(true);
  });

  it('only counts the last 1200 ms', () => {
    expect(isShake(strokes(5, 60, 240))).toBe(true);
    expect(isShake(strokes(5, 60, 250))).toBe(false);
  });

  it('is not fooled by a slow drag with jitter', () => {
    expect(isShake(Array.from({ length: 30 }, (_, i) => ({ t: i * 20, v: i * 10 + (i % 2) * 20 })))).toBe(false);
    expect(isShake([])).toBe(false);
  });
});

describe('isDizzy', () => {
  it('needs two full turns', () => {
    expect(isDizzy(4 * Math.PI - 0.01)).toBe(false);
    expect(isDizzy(4 * Math.PI)).toBe(true);
  });
});

describe('isTickle', () => {
  it('needs six taps within two seconds', () => {
    expect(isTickle([0, 400, 800, 1200, 1600], 1600)).toBe(false);
    expect(isTickle([0, 400, 800, 1200, 1600, 2000], 2000)).toBe(true);
    expect(isTickle([0, 400, 800, 1200, 1600, 2001], 2001)).toBe(false);
  });
});

describe('isSneeze', () => {
  it('needs 2400 px of scroll within 400 ms', () => {
    const gust = (px: number) => Array.from({ length: 5 }, (_, i) => ({ t: 1000 + i * 100, v: (i * px) / 4 }));
    expect(isSneeze(gust(2399))).toBe(false);
    expect(isSneeze(gust(2400))).toBe(true);
  });

  it('forgets scroll older than 400 ms', () => {
    expect(isSneeze([{ t: 0, v: 0 }, { t: 100, v: 2000 }, { t: 600, v: 2500 }])).toBe(false);
    expect(isSneeze([{ t: 0, v: 0 }, { t: 400, v: 2400 }])).toBe(true);
    expect(isSneeze([])).toBe(false);
  });
});
