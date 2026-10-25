import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isPublic, moduleSource, publicRepos, repoUrls } from './public-repos.mjs';

const answer = (codes) => async (url) => ({ status: codes[url].shift() });

test('finds every repository URL once, sorted, and not the profile', () => {
  const urls = repoUrls(["url: 'https://github.com/xdelmo/b-repo'", "'https://github.com/xdelmo/a.repo' 'https://github.com/xdelmo/b-repo'", "github: 'https://github.com/xdelmo',"]);
  assert.deepEqual(urls, ['https://github.com/xdelmo/a.repo', 'https://github.com/xdelmo/b-repo']);
});

test('200 is public, 404 is private, anything else is asked again', async () => {
  const codes = { a: [200], b: [404], c: [503, 200] };
  assert.equal(await isPublic('a', answer(codes)), true);
  assert.equal(await isPublic('b', answer(codes)), false);
  assert.equal(await isPublic('c', answer(codes), 3), true);
});

test('gives up after its tries, so a build never guesses', async () => {
  await assert.rejects(isPublic('x', answer({ x: [500, 500] }), 2), /x: HTTP 500/);
});

test('keeps only the public ones, in order, as a TypeScript module', async () => {
  const urls = await publicRepos(['a', 'b', 'c'], answer({ a: [200], b: [404], c: [200] }));
  assert.deepEqual(urls, ['a', 'c']);
  assert.match(moduleSource(urls), /export const PUBLIC_REPOS: readonly string\[\] = \[\n {2}"a",\n {2}"c"\n\];/);
});
