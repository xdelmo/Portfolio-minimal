import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PORTRAIT_SIZE, quantize, portraitString } from './portrait-lib.mjs';

test('the grey backdrop becomes empty, also where the wall is in shadow', () => {
  assert.equal(quantize(190, 190, 192), 0);
  assert.equal(quantize(120, 121, 124), 0);
  assert.equal(quantize(225, 226, 224), 0);
});

test('dark clothes, beard and glasses use the two deepest colours', () => {
  assert.equal(quantize(20, 20, 22), 1);
  assert.equal(quantize(80, 62, 55), 2);
});

test('skin falls into the three warm tones, from shadow to highlight', () => {
  assert.equal(quantize(150, 105, 90), 3);
  assert.equal(quantize(205, 160, 140), 4);
  assert.equal(quantize(240, 205, 190), 5);
});

test('every index is one of the palette slots', () => {
  for (let v = 0; v < 256; v += 17) for (const [r, g, b] of [[v, v, v], [v, v * 0.7, v * 0.6], [v * 0.6, v * 0.7, v]]) {
    const i = quantize(r, g, b);
    assert.ok(Number.isInteger(i) && i >= 0 && i <= 5, `${String(i)} for ${String([r, g, b])}`);
  }
});

test('portraitString turns RGBA pixels into one digit per cell', () => {
  const rgba = new Uint8ClampedArray(PORTRAIT_SIZE * PORTRAIT_SIZE * 4).fill(190);
  rgba.set([20, 20, 22, 255], 0);
  const s = portraitString(rgba);
  assert.equal(s.length, PORTRAIT_SIZE * PORTRAIT_SIZE);
  assert.equal(s[0], '1');
  assert.equal(s[1], '0');
});
