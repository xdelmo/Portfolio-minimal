import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SW_KILL_SWITCH, initialScripts, withFontPreload } from './postbuild-helpers.mjs';

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

test('lists the entry module and its modulepreloads once each', () => {
  const pageHtml =
    '<head><link rel="modulepreload" href="chunk-A.js"><link rel="modulepreload" href="chunk-B.js"></head>' +
    '<body><script src="main-X.js" type="module"></script><script src="chunk-A.js" type="module"></script></body>';
  assert.deepEqual(initialScripts(pageHtml).sort(), ['chunk-A.js', 'chunk-B.js', 'main-X.js']);
});

test('ignores inline scripts', () => {
  assert.deepEqual(initialScripts('<script>window.x = 1</script>'), []);
});

// issue #289: the old Gatsby site's service worker kept serving it at / to its past visitors
test('the /sw.js kill switch empties the caches, unregisters itself and reloads its pages', async () => {
  const listeners = {};
  const done = [];
  const self = {
    addEventListener: (type, fn) => (listeners[type] = fn),
    skipWaiting: () => done.push('skipWaiting'),
    registration: { unregister: async () => done.push('unregister') },
    clients: { matchAll: async () => [{ url: 'https://x/', navigate: (url) => done.push(`navigate ${url}`) }] },
  };
  const caches = { keys: async () => ['a', 'b'], delete: async (key) => done.push(`delete ${key}`) };
  new Function('self', 'caches', SW_KILL_SWITCH)(self, caches);
  listeners.install();
  let work;
  listeners.activate({ waitUntil: (p) => (work = p) });
  await work;
  assert.deepEqual(done, ['skipWaiting', 'delete a', 'delete b', 'unregister', 'navigate https://x/']);
});
