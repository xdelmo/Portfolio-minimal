// The favicon is the home's moai seen from the front (issue #323), drawn from the voxel model on a 16×16 grid.
// Run after changing the model: node scripts/favicon.mjs (scripts/favicon.test.mjs fails while public/ is stale).
import { Buffer } from 'node:buffer';
import { writeFileSync } from 'node:fs';
import { crc32, deflateSync } from 'node:zlib';
import { moaiVoxels } from '../src/app/voxel/moai.model.ts';
import { PHONE_GAZE, isPupil } from '../src/app/voxel/motion.ts';

// light theme colours, src/styles/_tokens.scss (the tab shows them on light and dark browsers alike)
const PALETTE = { stone: '#a3a39d', stoneDark: '#85857f', stoneLight: '#bdbdb6', eye: '#0066d4', eyeWhite: '#f2f2f2', pukao: '#ffc9a8', moss: '#bdbdb6' };
const BG = '#e5e5e5';
const SIZE = 16;
const NECK = 9; // the plain neck row is left out, so the head (lips to pukao) fits 16 rows

/** The head as a 16×16 grid of colours (null is transparent): the frontmost voxel of each column, open eyes. */
export function faviconGrid() {
  const voxels = moaiVoxels();
  const eyes = voxels.filter((v) => v.color === 'eye');
  const grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
  const depth = new Map();
  for (const v of voxels) {
    if (v.y < 8 || v.y === NECK) continue;
    const row = 24 - v.y - (v.y < NECK ? 1 : 0);
    const col = v.x + 7; // 11 columns wide: 2 empty on the left, 3 on the right (no odd width centres on 16)
    const key = `${String(row)},${String(col)}`;
    if ((depth.get(key) ?? -Infinity) > v.z) continue;
    depth.set(key, v.z);
    grid[row][col] = PALETTE[v.color === 'eye' && !isPupil(eyes, v, PHONE_GAZE) ? 'eyeWhite' : v.color];
  }
  return grid;
}

export function faviconSvg(grid = faviconGrid()) {
  const rects = grid.flatMap((cells, y) => cells.map((c, x) => (c ? `<rect x="${String(x)}" y="${String(y)}" width="1" height="1" fill="${c}"/>` : '')));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${String(SIZE)} ${String(SIZE)}" shape-rendering="crispEdges">${rects.join('')}</svg>\n`;
}

/** An RGBA PNG of the grid, each cell `scale` pixels, centred on a `size` square (filled with `bg` when given). */
export function png(grid, scale, size = SIZE * scale, bg = null) {
  const rgba = (hex) => (hex ? [...Buffer.from(hex.slice(1), 'hex'), 255] : [0, 0, 0, 0]);
  const pad = Math.floor((size - SIZE * scale) / 2);
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const gy = Math.floor((y - pad) / scale);
      const gx = Math.floor((x - pad) / scale);
      const cell = gy >= 0 && gy < SIZE && gx >= 0 && gx < SIZE ? grid[gy][gx] : null;
      raw.set(rgba(cell ?? bg), y * (size * 4 + 1) + 1 + x * 4);
    }
  }
  const chunk = (type, data) => {
    const out = Buffer.alloc(data.length + 12);
    out.writeUInt32BE(data.length);
    out.write(type, 4);
    data.copy(out, 8);
    out.writeUInt32BE(crc32(out.subarray(4, data.length + 8)), data.length + 8);
    return out;
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size);
  ihdr.writeUInt32BE(size, 4);
  ihdr.set([8, 6, 0, 0, 0], 8); // 8 bit RGBA
  return Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

/** A .ico holding PNG images (every browser reads them), one per size. */
export function ico(images) {
  const header = Buffer.alloc(6 + images.length * 16);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, data }, i) => {
    const e = 6 + i * 16;
    header.writeUInt8(size % 256, e);
    header.writeUInt8(size % 256, e + 1);
    header.writeUInt16LE(1, e + 4);
    header.writeUInt16LE(32, e + 6);
    header.writeUInt32LE(data.length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...images.map((i) => i.data)]);
}

export function faviconFiles() {
  const grid = faviconGrid();
  return {
    'favicon.svg': faviconSvg(grid),
    'favicon.ico': ico([1, 2, 3].map((s) => ({ size: SIZE * s, data: png(grid, s) }))),
    // iOS fills transparency with black: the page background behind 11 px cells, 2 px of margin
    'apple-touch-icon.png': png(grid, 11, 180, BG),
  };
}

if (import.meta.main) {
  for (const [name, data] of Object.entries(faviconFiles())) writeFileSync(`public/${name}`, data);
  console.log('public/favicon.svg, favicon.ico (16, 32, 48) and apple-touch-icon.png (180) written');
}
