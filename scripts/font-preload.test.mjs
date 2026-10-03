import assert from 'node:assert/strict';
import { test } from 'node:test';
import { withFontPreload } from './font-preload.mjs';

const html = '<html><head><base href="/en/"><link rel="stylesheet" href="styles.css"></head><body></body></html>';

test('preloads the font before the first stylesheet', () => {
  const out = withFontPreload(html, 'media/font.woff2');
  assert.match(out, /<link rel="preload" href="media\/font\.woff2" as="font" type="font\/woff2" crossorigin><link rel="stylesheet"/);
});

test('does not add the same preload twice', () => {
  const once = withFontPreload(html, 'media/font.woff2');
  assert.equal(withFontPreload(once, 'media/font.woff2'), once);
});

test('falls back to the end of <head> when there is no stylesheet link', () => {
  const out = withFontPreload('<head><title>x</title></head>', 'media/font.woff2');
  assert.match(out, /crossorigin><\/head>/);
});
