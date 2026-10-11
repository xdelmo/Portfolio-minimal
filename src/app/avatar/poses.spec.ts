import { describe, expect, it } from 'vitest';
import { MOVES, MOVE_MS, REST, STEP_MS, STRIDE, idlePose, movePose, walkPose } from './poses';

describe('walkPose', () => {
  it('holds each pose for a whole step, like pixel art', () => {
    expect(walkPose(STEP_MS + 1)).toEqual(walkPose(2 * STEP_MS - 1));
    expect(walkPose(STEP_MS + 1)).not.toEqual(walkPose(2 * STEP_MS + 1));
  });

  it('swings each arm against the leg on its side, never further than a stride', () => {
    for (let t = 0; t < 1000; t += STEP_MS) {
      const p = walkPose(t);
      expect(p.legL).toBeCloseTo(-p.legR);
      expect(p.armL).toBeCloseTo(-p.legL);
      expect(Math.abs(p.legL)).toBeLessThanOrEqual(STRIDE);
    }
  });
});

describe('idlePose', () => {
  it('only breathes: no stride, no lift', () => {
    const p = idlePose(1234);
    expect(p.legL).toBe(0);
    expect(p.lift).toBe(0);
    expect(Math.abs(p.nod)).toBeLessThan(0.05);
  });
});

describe('movePose', () => {
  it('ends after its time', () => {
    for (const move of MOVES) expect(movePose(move, MOVE_MS[move])).toBeNull();
  });

  it('starts and ends at rest, so it blends into whatever comes next', () => {
    for (const move of MOVES) {
      for (const t of [0, MOVE_MS[move] - 1]) {
        const p = movePose(move, t);
        if (!p) throw new Error(move);
        expect(p.armRaise, move).toBeCloseTo(REST.armRaise, 1);
        expect(p.lift, move).toBeCloseTo(REST.lift, 1);
        expect(Math.cos(p.spin), move).toBeCloseTo(1, 2);
      }
    }
  });

  it('raises the arm to wave, jumps four voxels, spins once', () => {
    const wave = movePose('wave', MOVE_MS.wave / 2);
    const jump = movePose('jump', MOVE_MS.jump / 2);
    const spin = movePose('spin', MOVE_MS.spin / 2);
    expect(wave?.armRaise).toBeGreaterThan(2);
    expect(jump?.lift).toBeCloseTo(4);
    expect(spin?.spin).toBeCloseTo(Math.PI);
  });
});
