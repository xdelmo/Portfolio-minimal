import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CHECKS, runChecks } from './verify-deploy.mjs';

const BASE = 'https://preview.example';
const response = (status, { location, body = '', type = 'text/html' } = {}) =>
  new globalThis.Response(status === 301 || status === 302 ? null : body, { status, headers: { ...(location ? { location } : {}), 'content-type': type } });

test('a row passes when status and location match', async () => {
  const [row] = await runChecks(BASE, async () => response(302, { location: `${BASE}/it/` }), [{ name: 'it root', path: '/', status: 302, location: '/it/' }]);
  assert.equal(row.ok, true);
});

test('the status must match exactly and the location must be the same absolute URL', async () => {
  const wrongStatus = await runChecks(BASE, async () => response(301, { location: `${BASE}/it/` }), [{ name: 'a', path: '/', status: 302, location: '/it/' }]);
  assert.equal(wrongStatus[0].ok, false);
  const wrongSlash = await runChecks(BASE, async () => response(302, { location: `${BASE}/it` }), [{ name: 'b', path: '/', status: 302, location: '/it/' }]);
  assert.equal(wrongSlash[0].ok, false);
  const relative = await runChecks(BASE, async () => response(302, { location: '/it/' }), [{ name: 'c', path: '/', status: 302, location: '/it/' }]);
  assert.equal(relative[0].ok, true);
});

test('content checks read the body and the content type', async () => {
  const html = await runChecks(BASE, async () => response(200, { body: '<!doctype html>' }), [{ name: 'llms', path: '/llms.txt', status: 200, contains: '# Emanuele Del Monte' }]);
  assert.equal(html[0].ok, false);
  const md = await runChecks(BASE, async () => response(200, { body: '# x', type: 'text/plain' }), [{ name: 'md', path: '/en/index.md', status: 200, contentType: 'text/markdown' }]);
  assert.equal(md[0].ok, false);
});

test('a network error fails its row and the others still run', async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls++;
    if (calls === 1) throw new Error('ECONNRESET');
    return response(200, { body: 'ok' });
  };
  const rows = await runChecks(BASE, fetchImpl, [{ name: 'a', path: '/a', status: 200 }, { name: 'b', path: '/b', status: 200 }]);
  assert.deepEqual(rows.map((r) => r.ok), [false, true]);
  assert.match(rows[0].detail, /ECONNRESET/);
});

test('the default table covers language, legacy, 404 and GEO rows', () => {
  const names = CHECKS.map((c) => c.name).join('\n');
  for (const part of ['it-IT', 'it-CH', 'de-DE', 'nf_lang', '/privacy', '/it/work/apexflw', 'llms.txt', 'index.md', 'sitemap.xml', 'og image']) {
    assert.ok(names.includes(part), part);
  }
});
