// The favicon is the brand's logo (issue #334): the moai seen from the front, one colour, drawn by hand on a 16×16 grid.
// Its features are holes, not shades, so it reads at 16 px: flat top, brow shelf, eye shadows, long nose, lips, square chin.
// Run after changing the drawing: node scripts/favicon.mjs (scripts/favicon.test.mjs fails while public/ is stale).
import { Buffer } from 'node:buffer';
import { writeFileSync } from 'node:fs';
import { crc32, deflateSync } from 'node:zlib';

export const MOAI = [
  '....########....',
  '....########....',
  '....########....',
  '...##########...',
  '...#...##...#...',
  '....#..##..#....',
  '....##.##.##....',
  '....##.##.##....',
  '....##.##.##....',
  '....#.####.#....',
  '....########....',
  '....########....',
  '....##....##....',
  '....########....',
  '....########....',
  '....########....',
];

// src/styles/_tokens.scss: ink on the light theme, paper on the dark one, concrete behind the PNGs
// (a .ico or a home screen icon cannot follow the theme, so they carry their own light tile)
const INK = '#1d1d1c';
const PAPER = '#f2f2f2';
const BG = '#e5e5e5';
const SIZE = 16;

/** The logo as a 16×16 grid of colours (null is transparent). */
export function faviconGrid(color = INK) {
  return MOAI.map((row) => [...row].map((c) => (c === '#' ? color : null)));
}

/** One path of unit squares, ink on light tabs and paper on dark ones. */
export function faviconSvg() {
  const d = MOAI.flatMap((row, y) => [...row].map((c, x) => (c === '#' ? `M${String(x)} ${String(y)}h1v1h-1z` : ''))).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${String(SIZE)} ${String(SIZE)}" shape-rendering="crispEdges"><style>path{fill:${INK}}@media (prefers-color-scheme:dark){path{fill:${PAPER}}}</style><path d="${d}"/></svg>\n`;
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
    'favicon.svg': faviconSvg(),
    'favicon.ico': ico([1, 2, 3].map((s) => ({ size: SIZE * s, data: png(grid, s, SIZE * s, BG) }))),
    // iOS fills transparency with black: the page background behind the logo, about a tenth of margin on each side
    'apple-touch-icon.png': png(grid, 9, 180, BG),
    'icon-192.png': png(grid, 9, 192, BG),
    'icon-512.png': png(grid, 25, 512, BG),
    // the farthest filled corner sits 8.9 cells from the centre: 20 px cells (179 px) keep it inside the 205 px safe circle
    'icon-maskable-512.png': png(grid, 20, 512, BG),
  };
}

if (import.meta.main) {
  for (const [name, data] of Object.entries(faviconFiles())) writeFileSync(`public/${name}`, data);
  console.log(`public/ ${Object.keys(faviconFiles()).join(', ')} written`);
}
