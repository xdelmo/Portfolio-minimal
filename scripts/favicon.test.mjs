import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { readFileSync } from 'node:fs';
import { MOAI, faviconFiles, faviconGrid, logoPath } from './favicon.mjs';

test('public/ holds the favicons drawn from the current logo (run node scripts/favicon.mjs)', () => {
  for (const [name, data] of Object.entries(faviconFiles())) {
    assert.ok(Buffer.from(data).equals(readFileSync(`public/${name}`)), `public/${name} is stale`);
  }
});

test('the logo is one colour, fills the 16 rows and is symmetric (issue #334)', () => {
  const grid = faviconGrid();
  assert.ok(grid.every((row) => row.some(Boolean)), 'an empty row');
  assert.deepEqual(new Set(grid.flat().filter(Boolean)), new Set(['#1d1d1c']));
  assert.ok(MOAI.every((row) => row.length === 16), 'a row is not 16 cells');
  assert.ok(MOAI.every((row) => row === [...row].reverse().join('')), 'not symmetric');
});

test('the svg follows the colour scheme, with one fill per theme', () => {
  const svg = faviconFiles()['favicon.svg'];
  assert.match(svg, /path\{fill:#1d1d1c\}@media \(prefers-color-scheme:dark\)\{path\{fill:#f2f2f2\}\}/);
});

test('the .ico carries 16, 32 and 48 px images, the touch and manifest icons their sizes', () => {
  const files = faviconFiles();
  const icoFile = files['favicon.ico'];
  assert.deepEqual([0, 1, 2].map((i) => icoFile.readUInt8(6 + i * 16)), [16, 32, 48]);
  for (const [name, size] of [['apple-touch-icon.png', 180], ['icon-192.png', 192], ['icon-512.png', 512], ['icon-maskable-512.png', 512]]) {
    assert.equal(files[name].readUInt32BE(16), size, name);
  }
});

test('the header mark draws the same logo as the favicon (issue #334)', () => {
  assert.ok(readFileSync('src/app/layout/moai-mark.ts', 'utf8').includes(`d="${logoPath()}"`), 'moai-mark.ts is stale: paste logoPath()');
});
