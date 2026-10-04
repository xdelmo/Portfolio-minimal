import { BREATH_MS, SCROLL_SWING, breath, follow, explodeAmount, gaze, scrollYaw, sectionProgress, smoothstep } from './motion';

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

  it('breathes: a small pitch that returns every BREATH_MS', () => {
    expect(breath(0)).toBeCloseTo(0);
    expect(Math.abs(breath(BREATH_MS / 4))).toBeGreaterThan(0.01);
    expect(Math.abs(breath(BREATH_MS / 4))).toBeLessThan(0.08);
    expect(breath(BREATH_MS)).toBeCloseTo(0);
  });

  it('follows a target smoothly, whatever the frame time', () => {
    expect(follow(0, 1, 0)).toBe(0);
    const step = follow(0, 1, 16);
    expect(step).toBeGreaterThan(0);
    expect(step).toBeLessThan(1);
    expect(follow(0, 1, 10_000)).toBeCloseTo(1);
  });

  it('lands exactly on the target once close, so a still scene stops changing', () => {
    expect(follow(0.99995, 1, 16)).toBe(1);
  });
});

describe('gaze', () => {
  it('looks towards the quadrant the pointer is in, seen from the moai', () => {
    expect(gaze(-100, -50)).toBe('left-up');
    expect(gaze(80, -10)).toBe('right-up');
    expect(gaze(-5, 200)).toBe('left-down');
    expect(gaze(300, 1)).toBe('right-down');
  });
});
