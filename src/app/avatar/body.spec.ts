import { describe, expect, it } from 'vitest';
import { voxelBody } from './body';
import { MOVE_MS, STEP_MS } from './poses';

describe('voxelBody', () => {
  const arm = (body: ReturnType<typeof voxelBody>) => body.object.children[0].children.map((joint) => joint.rotation);

  it('raises an arm to wave and puts it down when the move ends', () => {
    const body = voxelBody();
    body.play('wave');
    body.update(MOVE_MS.wave / 2, 'idle', 0, false);
    expect(Math.max(...arm(body).map((r) => r.z))).toBeGreaterThan(2);
    body.update(MOVE_MS.wave, 'idle', 0, false);
    expect(Math.max(...arm(body).map((r) => r.z))).toBe(0);
  });

  it('swings its limbs while it walks', () => {
    const body = voxelBody();
    body.update(2 * STEP_MS, 'walk', 0, false);
    expect(Math.max(...arm(body).map((r) => Math.abs(r.x)))).toBeGreaterThan(0.3);
  });

  it('holds still at idle while paused', () => {
    const body = voxelBody();
    body.update(500, 'idle', 0, true);
    expect(arm(body).every((r) => r.x === 0 && r.z === 0)).toBe(true);
  });
});
