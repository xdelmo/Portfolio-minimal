import assert from 'node:assert/strict';
import { test } from 'node:test';
import { moduleSource, publicList, publicRepos, repoUrls } from './public-repos.mjs';

const repo = (name) => ({ html_url: `https://github.com/xdelmo/${name}` });
// the API's answers in order: a status, or a 200 with this list of repositories
const answer = (replies) => async () => {
  const r = replies.shift();
  return typeof r === 'number' ? { status: r, json: async () => ({}) } : { status: 200, json: async () => r };
};

test('finds every repository URL once, sorted, and not the profile', () => {
  const urls = repoUrls(["url: 'https://github.com/xdelmo/b-repo'", "'https://github.com/xdelmo/a.repo' 'https://github.com/xdelmo/b-repo'", "github: 'https://github.com/xdelmo',"]);
  assert.deepEqual(urls, ['https://github.com/xdelmo/a.repo', 'https://github.com/xdelmo/b-repo']);
});

test('a failed answer is asked again', async () => {
  const open = await publicList(answer([503, [repo('A')]]), 3, '');
  assert.deepEqual([...open], ['https://github.com/xdelmo/a']);
});

test('gives up after its tries, so a build never guesses', async () => {
  await assert.rejects(publicList(answer([500, 403]), 2, ''), /HTTP 403/);
});

test('refuses a full page rather than miss the repositories on the next one', async () => {
  const page = Array.from({ length: 100 }, (_, i) => repo(String(i)));
  await assert.rejects(publicList(answer([page]), 1, ''), /paging/);
});

test('keeps only the public ones, in order, as a TypeScript module', async () => {
  const u = (n) => `https://github.com/xdelmo/${n}`;
  const urls = await publicRepos([u('a'), u('B'), u('c')], answer([[repo('a'), repo('b')]]));
  assert.deepEqual(urls, [u('a'), u('B')]);
  assert.match(moduleSource(['a', 'c']), /export const PUBLIC_REPOS: readonly string\[\] = \[\n {2}"a",\n {2}"c"\n\];/);
});
