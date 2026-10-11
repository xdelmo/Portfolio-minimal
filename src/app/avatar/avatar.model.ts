/**
 * My portrait as voxels, in six parts that turn on their joints: x across (the body spans -8…7, symmetric about
 * x = -0.5), y up from the soles, z towards the viewer (the face looks at +z). Minecraft proportions: an 8³ head on an
 * 8 × 12 × 4 body, 4 × 12 × 4 limbs, 32 voxels tall. No runtime imports: scripts/avatar-image.mjs loads this file directly.
 */
import type { Voxel } from '../voxel/moai.model';

export type AvatarColor = 'skin' | 'beard' | 'frames' | 'lens' | 'eye' | 'lips' | 'metal' | 'top' | 'sleeve' | 'pants' | 'shoes';

export type AvatarPart = 'head' | 'torso' | 'armL' | 'armR' | 'legL' | 'legR';

export interface PartModel {
  part: AvatarPart;
  /** The joint it turns on (cell corners: the cell x spans x…x + 1). */
  pivot: { x: number; y: number; z: number };
  voxels: Voxel<AvatarColor>[];
}

/** Room around the figure, as a multiple of its size, so a raised arm or a jump stays in frame. */
export const AVATAR_FRAME = 1.3;

/** Extra canvas on each side of the figure, as a fraction of its width: room for a turn or a spin. */
export const AVATAR_BLEED = 0.3;

export const AVATAR_HEIGHT = 32;

/** The head's colour at a cell; r is the row from the chin (0) to the crown (7). */
function headCell(x: number, r: number, z: number): AvatarColor {
  const side = x === -4 || x === 3;
  if (z === 3) {
    // the face: heavy dark frames over the eyes, the nose between the lenses, a short beard round the smile
    if (r === 5) return 'frames';
    if (r === 4) return x === -2 || x === 1 ? 'eye' : x === -3 || x === 2 ? 'lens' : 'frames';
    if (r === 3) return x === -3 || x === -2 || x === 1 || x === 2 ? 'frames' : 'skin';
    if (r === 1 && x >= -2 && x <= 1) return 'lips';
    if (r <= 2) return 'beard';
    return 'skin';
  }
  if (side && r === 5 && z >= 0) return 'frames'; // the arms of the glasses
  if (side && r <= 2 && z >= 0) return 'beard'; // along the jaw
  return 'skin';
}

function box(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, color: (x: number, y: number, z: number) => AvatarColor): Voxel<AvatarColor>[] {
  const voxels: Voxel<AvatarColor>[] = [];
  for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) voxels.push({ x, y, z, color: color(x, y, z) });
  return voxels;
}

export function avatarParts(): PartModel[] {
  const ears = [-5, 4].flatMap((x) => [
    { x, y: 27, z: 0, color: 'skin' as const },
    { x, y: 28, z: 0, color: 'skin' as const },
    { x, y: 26, z: 0, color: 'metal' as const }, // a small hoop under each ear
  ]);
  const leg = (x0: number): Voxel<AvatarColor>[] => box(x0, x0 + 3, 0, 11, -2, 1, (_x, y) => (y <= 1 ? 'shoes' : 'pants'));
  const arm = (x0: number): Voxel<AvatarColor>[] => box(x0, x0 + 3, 12, 23, -2, 1, (_x, y) => (y <= 13 ? 'skin' : 'sleeve'));
  return [
    { part: 'legL', pivot: { x: -2, y: 12, z: 0 }, voxels: leg(-4) },
    { part: 'legR', pivot: { x: 2, y: 12, z: 0 }, voxels: leg(0) },
    // a crew neck: the skin of the neck shows above the collar at the front
    { part: 'torso', pivot: { x: 0, y: 12, z: 0 }, voxels: box(-4, 3, 12, 23, -2, 1, (x, y, z) => (y === 23 && z === 1 && (x === -1 || x === 0) ? 'skin' : 'top')) },
    { part: 'armL', pivot: { x: -6, y: 22, z: 0 }, voxels: arm(-8) },
    { part: 'armR', pivot: { x: 6, y: 22, z: 0 }, voxels: arm(4) },
    { part: 'head', pivot: { x: 0, y: 24, z: 0 }, voxels: [...box(-4, 3, 24, 31, -4, 3, (x, y, z) => headCell(x, y - 24, z)), { x: -1, y: 27, z: 4, color: 'skin' }, { x: 0, y: 27, z: 4, color: 'skin' }, ...ears] },
  ];
}

/** Every voxel in the rest pose: the still image. */
export function avatarVoxels(): Voxel<AvatarColor>[] {
  return avatarParts().flatMap((p) => p.voxels);
}
