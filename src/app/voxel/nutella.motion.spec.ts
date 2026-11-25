import { POSE_FPS, createNutellaMotion, quantize } from './nutella.motion';

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ZERO_LOOK = { yaw: 0, pitch: 0 };

describe('nutella motion', () => {
  it('quantizes time at 12 fps', () => {
    expect(quantize(0)).toBe(0);
    expect(quantize(1 / 24)).toBe(0);
    expect(quantize(1 / POSE_FPS + 0.001)).toBeCloseTo(1 / 12, 6);
    expect(quantize(5 / POSE_FPS + 0.001)).toBeCloseTo(5 / 12, 6);
  });

  it('keeps the tail still over two seconds when down', () => {
    const motion = createNutellaMotion(mulberry32(1));
    for (let f = 0; f <= 2 * POSE_FPS; f++) {
      expect(motion.pose(quantize(f / POSE_FPS), 'down', ZERO_LOOK).tail).toBe(0);
    }
  });

  it('wags wider when eager than when idle', () => {
    const idleMotion = createNutellaMotion(mulberry32(2));
    const eagerMotion = createNutellaMotion(mulberry32(2));
    let maxIdle = 0;
    let maxEager = 0;
    for (let f = 0; f < 3 * POSE_FPS; f++) {
      const t = quantize(f / POSE_FPS);
      maxIdle = Math.max(maxIdle, Math.abs(idleMotion.pose(t, 'idle', ZERO_LOOK).tail));
      maxEager = Math.max(maxEager, Math.abs(eagerMotion.pose(t, 'eager', ZERO_LOOK).tail));
    }
    expect(maxEager).toBeGreaterThan(maxIdle);
  });

  it('blinks within five seconds and opens again within 0.2 s', () => {
    const motion = createNutellaMotion(mulberry32(3));
    const blinks: number[] = [];
    for (let f = 0; f <= 6 * POSE_FPS; f++) {
      const t = quantize(f / POSE_FPS);
      if (motion.pose(t, 'idle', ZERO_LOOK).blink) blinks.push(t);
    }
    expect(blinks.length).toBeGreaterThan(0);
    expect(blinks[0]).toBeLessThanOrEqual(5);
    const firstEnd = blinks.findIndex((time, i) => i > 0 && time - blinks[i - 1] > 1 / POSE_FPS + 0.01);
    const run = firstEnd === -1 ? blinks : blinks.slice(0, firstEnd);
    expect(run[run.length - 1] - run[0]).toBeLessThanOrEqual(0.2);
  });

  it('hops on bark and lands before half a second', () => {
    const motion = createNutellaMotion(mulberry32(4));
    motion.bark(0);
    expect(motion.pose(quantize(0.2), 'idle', ZERO_LOOK).hop).toBeGreaterThan(0);
    expect(motion.pose(quantize(0.5), 'idle', ZERO_LOOK).hop).toBe(0);
  });
});
