import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { HASHED_FILE, contentSecurityPolicy, headersFile, inlineScriptHashes } from './security-headers.mjs';

const sha = (s) => `'sha256-${createHash('sha256').update(s).digest('base64')}'`;

test('hashes every inline script that runs, once, and skips data blocks and external scripts', () => {
  const page = (theme) =>
    `<script>${theme}</script><script type="text/javascript" id="c">boot()</script>` +
    '<script type="application/ld+json">{"a":1}</script><script id="ng-state" type="application/json">{}</script>' +
    '<script src="main.js" type="module"></script>';
  assert.deepEqual(inlineScriptHashes([page('t()'), page('t()')]), [sha('t()'), sha('boot()')].sort());
});

test('the policy allows the hashes and the site only, and forbids framing', () => {
  const csp = contentSecurityPolicy(["'sha256-x'"]);
  assert.match(csp, /script-src 'self' 'sha256-x'(;|$)/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.doesNotMatch(csp, /script-src[^;]*unsafe-inline/);
});

test('the _headers file applies to every path', () => {
  const file = headersFile('default-src x');
  assert.match(file, /^\/\*\n/);
  assert.match(file, /X-Content-Type-Options: nosniff/);
  assert.match(file, /^ {2}Content-Security-Policy: default-src x$/m);
});

test('hashed build files are cached for a year, and only they (issue #153)', () => {
  const hashed = ['en/main-K4PR4QRI.js', 'en/chunk-g-uCFtW6.js', 'it/styles-D4LTOVL6.css', 'en/media/font-NDB4KJ7D.woff2'];
  for (const path of hashed) assert.match(path, HASHED_FILE);
  for (const path of ['en/index.html', 'en/favicon.svg', 'en/images/work/apexflow.jpg', 'en/og/en-home.png', 'en/main.js']) {
    assert.doesNotMatch(path, HASHED_FILE);
  }
  const file = headersFile('default-src x', ['en/main-K4PR4QRI.js']);
  assert.match(file, /^\/en\/main-K4PR4QRI\.js\n {2}Cache-Control: public, max-age=31536000, immutable$/m);
  assert.doesNotMatch(headersFile('default-src x'), /immutable/);
});
