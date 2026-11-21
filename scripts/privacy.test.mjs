import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

// Every cookie and storage key the site writes is named on the privacy page, in both languages (issue #607).
const files = readdirSync('src', { recursive: true })
  .map(String)
  .filter((f) => /\.(ts|html)$/.test(f) && !/\.spec\.ts$|generated/.test(f))
  .map((f) => readFileSync(join('src', f), 'utf8'));
const consts = new Map();
for (const src of files) for (const [, name, value] of src.matchAll(/const (\w+) = '([^']+)'/g)) consts.set(name, value);

function writtenKeys() {
  const keys = new Set();
  for (const src of files) {
    const local = new Map([...src.matchAll(/const (\w+) = '([^']+)'/g)].map(([, n, v]) => [n, v]));
    for (const [, arg] of src.matchAll(/\.setItem\(\s*('[^']+'|\w+)/g)) {
      const key = arg.startsWith("'") ? arg.slice(1, -1) : (local.get(arg) ?? consts.get(arg));
      assert.ok(key, `cannot resolve the storage key ${arg}`);
      keys.add(key);
    }
    for (const [, name] of src.matchAll(/\.cookie = `(\w+)=/g)) keys.add(name);
  }
  return keys;
}

test('finds the keys the code writes', () => {
  const keys = writtenKeys();
  for (const key of ['nf_lang', 'theme', 'explored', 'intro', 'motion-paused', 'lang-swap', 'moai-hello']) {
    assert.ok(keys.has(key), key);
  }
});

for (const lang of ['en', 'it']) {
  test(`${lang}: the privacy page names every key the site writes`, () => {
    const content = readFileSync(`src/app/content/content.${lang}.ts`, 'utf8');
    for (const key of writtenKeys()) assert.match(content, new RegExp(`\\b${key}\\b`), `${key} missing from content.${lang}.ts`);
  });
}
