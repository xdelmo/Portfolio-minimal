import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pushedBranches, validBranch } from './branch-name.mjs';

test('a branch says what it does before the slash', () => {
  for (const name of ['feat/404-wild-encounter', 'fix/hero-lede', 'docs/claude-md-linux', 'chore/triage', 'fix/45-hero', 'v2', 'master', 'devel', 'archive/gatsby-master']) {
    assert.ok(validBranch(name), name);
  }
  for (const name of ['hero-lede', 'worktree-pixel-field-fade', 'robustness-skills', 'feature/x', 'feat/', 'feat/Hero', 'fix/a/b', 'v3']) {
    assert.ok(!validBranch(name), name);
  }
});

test('the pre-push hook checks the branches pushed, never a deletion', () => {
  const zero = '0'.repeat(40);
  const stdin = [
    `refs/heads/fix/hero ${'a'.repeat(40)} refs/heads/fix/hero ${zero}`,
    `(delete) ${zero} refs/heads/robustness-skills ${'b'.repeat(40)}`,
    `refs/tags/v1 ${'c'.repeat(40)} refs/tags/v1 ${zero}`,
    '',
  ].join('\n');
  assert.deepEqual(pushedBranches(stdin), ['fix/hero']);
});
