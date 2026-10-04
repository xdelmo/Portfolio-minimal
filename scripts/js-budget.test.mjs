import assert from 'node:assert/strict';
import { test } from 'node:test';
import { initialScripts } from './js-budget.mjs';

test('lists the entry module and its modulepreloads once each', () => {
  const html =
    '<head><link rel="modulepreload" href="chunk-A.js"><link rel="modulepreload" href="chunk-B.js"></head>' +
    '<body><script src="main-X.js" type="module"></script><script src="chunk-A.js" type="module"></script></body>';
  assert.deepEqual(initialScripts(html).sort(), ['chunk-A.js', 'chunk-B.js', 'main-X.js']);
});

test('ignores inline scripts', () => {
  assert.deepEqual(initialScripts('<script>window.x = 1</script>'), []);
});
