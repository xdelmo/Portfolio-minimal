import type { Voxel, VoxelColor } from './moai.model';

export const COS30 = Math.cos(Math.PI / 6);

export interface IsoFace {
  points: readonly (readonly [number, number])[];
  color: VoxelColor;
  shade: number;
}

export interface IsoBounds {
  minX: number;
  minY: number;
  width: number;
  height: number;
}

/** True isometric view from (1, 1, 1): x goes down-right, z down-left, y straight up. */
export function project(x: number, y: number, z: number): [number, number] {
  return [(x - z) * COS30, (x + z) / 2 - y];
}

/** Exposed front (+z), right (+x) and top (+y) faces, ordered from the farthest cube to the nearest. */
export function isoFaces(voxels: readonly Voxel[]): IsoFace[] {
  const key = (x: number, y: number, z: number): string => `${String(x)},${String(y)},${String(z)}`;
  const filled = new Set(voxels.map((v) => key(v.x, v.y, v.z)));
  const faces: IsoFace[] = [];
  const farFirst = [...voxels].sort((a, b) => a.x + a.y + a.z - (b.x + b.y + b.z));
  for (const { x, y, z, color } of farFirst) {
    if (!filled.has(key(x, y, z + 1))) {
      faces.push({ color, shade: 0.86, points: [project(x, y, z + 1), project(x + 1, y, z + 1), project(x + 1, y + 1, z + 1), project(x, y + 1, z + 1)] });
    }
    if (!filled.has(key(x + 1, y, z))) {
      faces.push({ color, shade: 0.72, points: [project(x + 1, y, z), project(x + 1, y, z + 1), project(x + 1, y + 1, z + 1), project(x + 1, y + 1, z)] });
    }
    if (!filled.has(key(x, y + 1, z))) {
      faces.push({ color, shade: 1, points: [project(x, y + 1, z), project(x + 1, y + 1, z), project(x + 1, y + 1, z + 1), project(x, y + 1, z + 1)] });
    }
  }
  return faces;
}

export function isoBounds(faces: readonly IsoFace[]): IsoBounds {
  const xs = faces.flatMap((f) => f.points.map((p) => p[0]));
  const ys = faces.flatMap((f) => f.points.map((p) => p[1]));
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return { minX, minY, width: Math.max(...xs) - minX, height: Math.max(...ys) - minY };
}

export function shadeHex(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `#${[n >> 16, (n >> 8) & 255, n & 255].map((c) => Math.round(c * k).toString(16).padStart(2, '0')).join('')}`;
}

/** `frame` > 1 adds transparent room around the drawing, keeping it centred. */
export function isoSvg(voxels: readonly Voxel[], palette: Readonly<Record<VoxelColor, string>>, unit: number, frame = 1): string {
  const faces = isoFaces(voxels);
  const b = isoBounds(faces);
  const num = (n: number): string => String(Math.round(n * 10) / 10);
  const padX = ((frame - 1) / 2) * b.width;
  const padY = ((frame - 1) / 2) * b.height;
  const point = (p: readonly [number, number]): string => `${num((p[0] - b.minX + padX) * unit)},${num((p[1] - b.minY + padY) * unit)}`;
  const polygons = faces.map((f) => {
    const fill = shadeHex(palette[f.color], f.shade);
    return `<polygon points="${f.points.map(point).join(' ')}" fill="${fill}" stroke="${fill}" stroke-width="0.6" stroke-linejoin="round"/>`;
  });
  const w = String(Math.round(b.width * frame * unit));
  const h = String(Math.round(b.height * frame * unit));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${polygons.join('')}</svg>`;
}
