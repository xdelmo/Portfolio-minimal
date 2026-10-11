import { describe, expect, it } from 'vitest';
import { AVATAR_HEIGHT, avatarParts, avatarVoxels } from './avatar.model';

describe('avatar model', () => {
  const voxels = avatarVoxels();
  const key = (x: number, y: number, z: number): string => `${String(x)},${String(y)},${String(z)}`;

  it('has six parts and no cell twice', () => {
    expect(avatarParts().map((p) => p.part).sort()).toEqual(['armL', 'armR', 'head', 'legL', 'legR', 'torso']);
    expect(new Set(voxels.map((v) => key(v.x, v.y, v.z))).size).toBe(voxels.length);
  });

  it('stands 32 voxels tall on its soles', () => {
    const ys = voxels.map((v) => v.y);
    expect(Math.min(...ys)).toBe(0);
    expect(Math.max(...ys) + 1).toBe(AVATAR_HEIGHT);
  });

  it('is symmetric left to right in shape', () => {
    const cells = new Set(voxels.map((v) => key(v.x, v.y, v.z)));
    for (const v of voxels) expect(cells.has(key(-1 - v.x, v.y, v.z))).toBe(true);
  });

  it('turns each part on a joint at its edge', () => {
    for (const { part, pivot, voxels: own } of avatarParts()) {
      const ys = own.map((v) => v.y);
      // limbs hang from the top of their box (shoulder, hip), the head and body sit on the bottom
      const edge = part.startsWith('arm') ? Math.max(...ys) - 1 : part.startsWith('leg') ? Math.max(...ys) + 1 : Math.min(...ys);
      expect(pivot.y, part).toBe(edge);
    }
  });

  it('wears glasses over two eyes, a beard and a smile', () => {
    const count = (color: string): number => voxels.filter((v) => v.color === color).length;
    expect(count('eye')).toBe(2);
    expect(count('frames')).toBeGreaterThan(8);
    expect(count('beard')).toBeGreaterThan(8);
    expect(count('lips')).toBe(4);
    expect(count('metal')).toBe(2);
  });
});
