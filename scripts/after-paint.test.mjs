import assert from 'node:assert/strict';
import { test } from 'node:test';
import { withScriptsAfterPaint } from './after-paint.mjs';

const html =
  '<head><script>theme()</script></head><body><app-root></app-root>' +
  '<script src="polyfills-A.js" type="module"></script><script src="main-B.js" type="module"></script>' +
  '<link rel="modulepreload" href="chunk-C.js"><link rel="modulepreload" href="chunk-D.js"></body>';

test('loads the entry points from one inline script after the first frame, in their order', () => {
  const out = withScriptsAfterPaint(html);
  assert.doesNotMatch(out, /type="module"><\/script>/);
  assert.match(out, /requestAnimationFrame\(\(\)=>setTimeout\(/);
  assert.match(out, /\["polyfills-A\.js","main-B\.js"\]/);
  assert.match(out, /e\.async=false/);
  assert.equal(out.match(/requestAnimationFrame/g).length, 1);
});

test('drops the modulepreloads and leaves the other inline scripts alone', () => {
  const out = withScriptsAfterPaint(html);
  assert.doesNotMatch(out, /modulepreload/);
  assert.match(out, /<script>theme\(\)<\/script>/);
});

test('leaves a page without module scripts as it is', () => {
  assert.equal(withScriptsAfterPaint('<body></body>'), '<body></body>');
});
