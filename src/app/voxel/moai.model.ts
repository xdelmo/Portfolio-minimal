/**
 * The moai as a voxel grid: x across (0 is the nose column), y up, z towards the viewer
 * (the face looks at +z). No runtime imports: scripts/moai-image.mjs loads this file directly.
 */

export type VoxelColor = 'stone' | 'stoneDark' | 'stoneLight' | 'eye' | 'pukao' | 'moss';

export interface Voxel {
  x: number;
  y: number;
  z: number;
  color: VoxelColor;
}

export const MOAI_BOUNDS = { minX: -5, maxX: 5, minY: 0, maxY: 24, minZ: -3, maxZ: 5 } as const;

/** Shape only: the colour a cell has before moss and weathering, or null when it is empty. */
export function moaiCell(x: number, y: number, z: number): VoxelColor | null {
  const ax = Math.abs(x);
  const az = Math.abs(z);
  if (y < MOAI_BOUNDS.minY || y > MOAI_BOUNDS.maxY || ax > MOAI_BOUNDS.maxX || z < MOAI_BOUNDS.minZ || z > MOAI_BOUNDS.maxZ) {
    return null;
  }

  if (y <= 7) {
    // torso: rounded back corners, arms down the sides, hands meeting on the belly
    if (z > 3 || (ax === 5 && az === 3)) return null;
    if (y === 3 && z === 3 && ax <= 4) return 'stoneDark';
    if (ax === 5 && y >= 2 && z >= 0) return 'stoneDark';
    return 'stone';
  }
  if (y <= 9) return ax <= 4 && z <= 3 ? 'stone' : null; // neck
  if (y <= 20) {
    if (ax === 5) return y >= 11 && y <= 18 && (z === -1 || z === 0) ? 'stoneDark' : null; // long ears
    if (z <= 3) return z === 3 && y >= 15 && y <= 16 && ax >= 2 && ax <= 3 ? 'eye' : 'stone';
    if (z === 4) {
      if (y >= 18 && y <= 19) return 'stoneLight'; // heavy brow
      if (ax === 0 && y >= 11) return 'stoneLight'; // long nose
      if (ax === 1 && y === 11) return 'stoneLight'; // nostrils
      if (y === 10 && ax <= 2) return 'stoneDark'; // pursed lips
      return null;
    }
    return ax === 0 && y >= 11 && y <= 13 ? 'stoneLight' : null; // tip of the nose (z = 5)
  }
  if (y <= 21) return ax <= 3 && az <= 2 ? 'stone' : null; // crown
  return x * x + z * z <= 9 ? 'pukao' : null; // pukao (y 22–24)
}

/** Deterministic noise in [0, 1) for moss and weathering. */
function noise(x: number, y: number, z: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return s - Math.floor(s);
}

export function moaiVoxels(): Voxel[] {
  const voxels: Voxel[] = [];
  for (let y = MOAI_BOUNDS.minY; y <= MOAI_BOUNDS.maxY; y++) {
    for (let z = MOAI_BOUNDS.minZ; z <= MOAI_BOUNDS.maxZ; z++) {
      for (let x = MOAI_BOUNDS.minX; x <= MOAI_BOUNDS.maxX; x++) {
        const base = moaiCell(x, y, z);
        if (!base) continue;
        let color: VoxelColor = base;
        if (base === 'stone') {
          const n = noise(x, y, z);
          if (moaiCell(x, y + 1, z) === null && n < 0.3) color = 'moss';
          else if (n > 0.86) color = 'stoneLight';
        }
        voxels.push({ x, y, z, color });
      }
    }
  }
  return voxels;
}
