// The post-checkout hook must never fail a checkout: Netlify's cached clone runs it before npm exists (issue #298).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const hook = resolve('.githooks/post-checkout');
const repo = mkdtempSync(join(tmpdir(), 'post-checkout-'));
const git = (...args) =>
  execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...args], { cwd: repo, encoding: 'utf8' }).trim();
git('init', '-q');
const commit = (lock) => {
  writeFileSync(join(repo, 'package-lock.json'), lock);
  git('add', '.');
  git('commit', '-qm', lock);
  return git('rev-parse', 'HEAD');
};
const before = commit('{}');
const after = commit('{"v":2}');

const run = (env) =>
  spawnSync('sh', [hook, before, after, '1'], { cwd: repo, encoding: 'utf8', env: { PATH: '/usr/bin:/bin', HOME: repo, ...env } });

test('skips without npm on PATH', () => {
  const r = run({});
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /npm not found/);
});

test('skips on CI and Netlify', () => {
  for (const env of [{ CI: 'true' }, { NETLIFY: 'true' }]) {
    const r = run(env);
    assert.equal(r.status, 0, r.stderr);
    assert.doesNotMatch(r.stdout, /running npm ci/);
  }
});
