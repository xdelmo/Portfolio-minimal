import { COS30, isoBounds, isoFaces } from './iso';
import { MOAI_BLEED, MOAI_BOUNDS, MOAI_FRAME, moaiCell, moaiVoxels } from './moai.model';
import { GUM_LIPS, bubbleCells } from './motion';

describe('moai model', () => {
  const voxels = moaiVoxels();
  const key = (x: number, y: number, z: number): string => `${String(x)},${String(y)},${String(z)}`;
  const positions = new Set(voxels.map((v) => key(v.x, v.y, v.z)));

  it('has a sensible number of unique voxels inside its bounds', () => {
    expect(voxels.length).toBeGreaterThan(1200);
    expect(voxels.length).toBeLessThan(2200);
    expect(positions.size).toBe(voxels.length);
    for (const v of voxels) {
      expect(v.x).toBeGreaterThanOrEqual(MOAI_BOUNDS.minX);
      expect(v.x).toBeLessThanOrEqual(MOAI_BOUNDS.maxX);
      expect(v.y).toBeGreaterThanOrEqual(MOAI_BOUNDS.minY);
      expect(v.y).toBeLessThanOrEqual(MOAI_BOUNDS.maxY);
      expect(v.z).toBeGreaterThanOrEqual(MOAI_BOUNDS.minZ);
      expect(v.z).toBeLessThanOrEqual(MOAI_BOUNDS.maxZ);
    }
  });

  it('is symmetric left to right', () => {
    for (const v of voxels) expect(positions.has(key(-v.x, v.y, v.z))).toBe(true);
  });

  it('wears the pukao on top and looks out with two accent eyes', () => {
    expect(voxels.filter((v) => v.y === MOAI_BOUNDS.maxY).every((v) => v.color === 'pukao')).toBe(true);
    expect(voxels.filter((v) => v.color === 'eye')).toHaveLength(8);
  });

  it('only the nose reaches the front-most layer', () => {
    const front = voxels.filter((v) => v.z === MOAI_BOUNDS.maxZ);
    expect(front.length).toBeGreaterThan(0);
    expect(front.every((v) => v.x === 0)).toBe(true);
  });

  it('grows moss only on stone with nothing above it', () => {
    const moss = voxels.filter((v) => v.color === 'moss');
    expect(moss.length).toBeGreaterThan(0);
    for (const v of moss) {
      expect(moaiCell(v.x, v.y, v.z)).toBe('stone');
      expect(moaiCell(v.x, v.y + 1, v.z)).toBeNull();
    }
  });

  it('is the same every time', () => {
    expect(moaiVoxels()).toEqual(voxels);
  });
});

describe('moai frame', () => {
  // the scene's camera frames the moai's isometric bounds times MOAI_FRAME, widened by MOAI_BLEED on each side;
  // the bubble hangs from the lips (gum ball at y 10.5, z 4.5 in the pivot, dropped GUM_DROP rows), and the pivot turns
  it('keeps the whole bubble inside the picture at any angle the moai turns to', () => {
    const bounds = isoBounds(isoFaces(moaiVoxels()));
    const centre = bounds.minX + bounds.width / 2;
    const half = ((bounds.width * MOAI_FRAME) / 2) * (1 + 2 * MOAI_BLEED);
    let widest = 0;
    for (let yaw = 0; yaw < Math.PI * 2; yaw += Math.PI / 90) {
      for (const c of bubbleCells()) {
        for (const [dx, dz] of [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]]) {
          const x = c.x + dx;
          const z = c.z + 0.5 + GUM_LIPS.z + 0.5 + dz;
          const wx = 0.5 + x * Math.cos(yaw) + z * Math.sin(yaw);
          const wz = 0.5 - x * Math.sin(yaw) + z * Math.cos(yaw);
          widest = Math.max(widest, Math.abs((wx - wz) * COS30 - centre));
        }
      }
    }
    expect(widest).toBeLessThanOrEqual(half);
  });
});
