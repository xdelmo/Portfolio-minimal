import { SCROLL_SWING, approach, explodeAmount, scrollYaw, sectionProgress, smoothstep } from './motion';

describe('moai motion', () => {
  it('measures how far the section has scrolled past the middle of the screen', () => {
    expect(sectionProgress(1000, 800, 900)).toBe(0);
    expect(sectionProgress(450, 800, 900)).toBe(0);
    expect(sectionProgress(50, 800, 900)).toBeCloseTo(0.5);
    expect(sectionProgress(-1000, 800, 900)).toBe(1);
  });

  it('swings the moai and brings it back facing forward', () => {
    expect(scrollYaw(0)).toBe(0);
    expect(scrollYaw(0.25)).toBeCloseTo(SCROLL_SWING);
    expect(scrollYaw(0.75)).toBeCloseTo(-SCROLL_SWING);
    expect(scrollYaw(1)).toBeCloseTo(0);
  });

  it('eases between two edges', () => {
    expect(smoothstep(0.8, 1, 0.5)).toBe(0);
    expect(smoothstep(0.8, 1, 0.9)).toBeCloseTo(0.5);
    expect(smoothstep(0.8, 1, 2)).toBe(1);
  });

  it('bursts only at the end of the section', () => {
    expect(explodeAmount(0)).toBe(0);
    expect(explodeAmount(0.5)).toBe(0);
    expect(explodeAmount(1)).toBe(1);
  });

  it('approaches a target without overshooting, whatever the frame time', () => {
    expect(approach(0, 10, 10, 0)).toBe(0);
    const step = approach(0, 10, 10, 16);
    expect(step).toBeGreaterThan(0);
    expect(step).toBeLessThan(10);
    expect(approach(0, 10, 10, 10_000)).toBeCloseTo(10);
  });
});
