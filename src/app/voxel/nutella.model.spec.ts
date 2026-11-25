import { isHead, isTail, nutellaShadowCells, nutellaVoxels } from './nutella.model';

describe('nutella model', () => {
  const voxels = nutellaVoxels();
  const key = (x: number, y: number, z: number): string => `${String(x)},${String(y)},${String(z)}`;
  const cells = new Map(voxels.map((v) => [key(v.x, v.y, v.z), v.color]));

  it('has no voxel twice', () => {
    expect(cells.size).toBe(voxels.length);
  });

  it('is symmetric, colours included', () => {
    for (const v of voxels) expect(cells.get(key(10 + 1 - v.x, v.y, v.z)), key(v.x, v.y, v.z)).toBe(v.color);
  });

  it('has no loose cube', () => {
    const loose = voxels.filter((v) =>
      [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].every(([dx, dy, dz]) => !cells.has(key(v.x + dx, v.y + dy, v.z + dz))),
    );
    expect(loose).toEqual([]);
  });

  it('has a head, a tail and a shadow', () => {
    expect(voxels.some(isHead)).toBe(true);
    expect(voxels.some(isTail)).toBe(true);
    expect(nutellaShadowCells(voxels).length).toBeGreaterThan(0);
  });
});
