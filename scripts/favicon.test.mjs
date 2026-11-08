import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { readFileSync } from 'node:fs';
import { faviconFiles, faviconGrid } from './favicon.mjs';

test('public/ holds the favicons drawn from the current moai model (run node scripts/favicon.mjs)', () => {
  for (const [name, data] of Object.entries(faviconFiles())) {
    assert.ok(Buffer.from(data).equals(readFileSync(`public/${name}`)), `public/${name} is stale`);
  }
});

test('the head fills the 16 rows, pukao on top and lips at the bottom, with blue pupils', () => {
  const grid = faviconGrid();
  assert.ok(grid.every((row) => row.some(Boolean)), 'an empty row');
  assert.ok(grid[0].includes('#ffc9a8'));
  assert.ok(grid[15].includes('#85857f'));
  assert.equal(grid.flat().filter((c) => c === '#0066d4').length, 2);
});

test('the .ico carries 16, 32 and 48 px images, the touch icon is 180 px', () => {
  const files = faviconFiles();
  const icoFile = files['favicon.ico'];
  assert.deepEqual([0, 1, 2].map((i) => icoFile.readUInt8(6 + i * 16)), [16, 32, 48]);
  assert.equal(files['apple-touch-icon.png'].readUInt32BE(16), 180);
});
