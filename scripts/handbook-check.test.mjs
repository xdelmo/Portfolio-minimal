import assert from 'node:assert/strict';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { checkHandbook, findLeaks } from './handbook-check.mjs';

test('flags secrets, e-mail addresses and local paths, with their line', () => {
  assert.deepEqual(findLeaks('ok\ntoken ghp_abcdefghijklmnopqrstuvwxyz0123'), ['2: GitHub token']);
  assert.deepEqual(findLeaks('https://api.netlify.com/build_hooks/abc123'), ['1: Netlify build hook']);
  assert.deepEqual(findLeaks('-----BEGIN OPENSSH PRIVATE KEY-----'), ['1: private key']);
  assert.deepEqual(findLeaks('write to someone@example.com'), ['1: e-mail address']);
  assert.deepEqual(findLeaks('cd /Users/someone/development'), ['1: local path']);
  assert.deepEqual(findLeaks('C:\\Users\\someone'), ['1: local path']);
});

test('lets ordinary documentation through', () => {
  assert.deepEqual(findLeaks('`npm run verify`, the `NETLIFY_BUILD_HOOK` secret, `src/app/core/theme/theme.ts`, `@angular/core`'), []);
});

test('the handbook in this repository has nothing sensitive', () => {
  assert.deepEqual(checkHandbook(join(fileURLToPath(import.meta.url), '../..')), []);
});
