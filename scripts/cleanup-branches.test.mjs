// Unit tests for scripts/cleanup-branches.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import { parseWorktrees, planCleanup } from './cleanup-branches.mjs';

const wt = (path, branch, oid, extra = {}) => ({ path, branch, oid, main: false, locked: false, dirty: false, ...extra });
const base = {
  prs: [
    { head: 'fix/1-a', oid: 'a1' },
    { head: 'feat/2-b', oid: 'b1' },
    { head: 'devel', oid: 'd1' },
  ],
  local: [],
  remote: [],
  worktrees: [],
  busy: [],
};

test('a branch goes only when a merged PR has its exact tip', () => {
  const plan = planCleanup({
    ...base,
    local: [
      { name: 'fix/1-a', oid: 'a1' },
      { name: 'feat/2-b', oid: 'b2' }, // a commit after the merge
      { name: 'feat/3-c', oid: 'c1' }, // never merged
    ],
    remote: [
      { name: 'fix/1-a', oid: 'a1' },
      { name: 'feat/2-b', oid: 'b2' },
    ],
  });
  assert.deepEqual(plan.local, ['fix/1-a']);
  assert.deepEqual(plan.remote, ['fix/1-a']);
});

test('release and archive branches always stay', () => {
  const branches = ['master', 'devel', 'v2', 'archive/gatsby'].map((name) => ({ name, oid: 'd1' }));
  const prs = branches.map((b) => ({ head: b.name, oid: 'd1' }));
  const plan = planCleanup({ ...base, prs, local: branches, remote: branches });
  assert.deepEqual(plan, { worktrees: [], local: [], remote: [] });
});

test('a worktree goes only when merged, clean, unlocked, unused and not the main checkout', () => {
  const plan = planCleanup({
    ...base,
    local: [{ name: 'fix/1-a', oid: 'a1' }],
    worktrees: [
      wt('/repo', 'fix/1-a', 'a1', { main: true }),
      wt('/w/ok', 'fix/1-a', 'a1'),
      wt('/w/dirty', 'fix/1-a', 'a1', { dirty: true }),
      wt('/w/locked', 'fix/1-a', 'a1', { locked: true }),
      wt('/w/busy', 'fix/1-a', 'a1'),
      wt('/w/open', 'feat/3-c', 'c1'),
      wt('/w/detached', undefined, 'a1'),
    ],
    busy: ['/w/busy/src'],
  });
  assert.deepEqual(plan.worktrees, ['/w/ok']);
  assert.deepEqual(plan.local, [], 'still checked out in a kept worktree');
});

test('a worktree holding a kept one stays, nested removable ones go deepest first', () => {
  const plan = planCleanup({
    ...base,
    worktrees: [
      wt('/w/outer', 'fix/1-a', 'a1'),
      wt('/w/outer/.claude/worktrees/inner', 'feat/3-c', 'c1'),
      wt('/w/two', 'fix/1-a', 'a1'),
      wt('/w/two/.claude/worktrees/deep', 'feat/2-b', 'b1'),
    ],
  });
  assert.deepEqual(plan.worktrees, ['/w/two/.claude/worktrees/deep', '/w/two']);
});

test('parseWorktrees reads the porcelain listing', () => {
  const list = parseWorktrees(
    'worktree /repo\nHEAD d1\nbranch refs/heads/devel\n\nworktree /w/a\nHEAD a1\nbranch refs/heads/fix/1-a\nlocked\n\nworktree /w/b\nHEAD b1\ndetached\n',
  );
  assert.deepEqual(list, [
    { path: '/repo', oid: 'd1', branch: 'devel', main: true, locked: false },
    { path: '/w/a', oid: 'a1', branch: 'fix/1-a', main: false, locked: true },
    { path: '/w/b', oid: 'b1', branch: undefined, main: false, locked: false },
  ]);
});
