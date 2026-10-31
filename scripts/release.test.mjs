// Unit tests for scripts/release.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  categorizeCommit,
  determineBumpType,
  generateReleaseNotes,
  incrementVersion,
  isBreakingChange,
  parseSemVer,
  updatePackageJsonVersion,
  updatePackageLockVersion,
} from './release.mjs';

test('parseSemVer parses valid versions and rejects invalid', () => {
  assert.deepEqual(parseSemVer('1.2.3'), [1, 2, 3]);
  assert.deepEqual(parseSemVer('2.10.4-beta.1'), [2, 10, 4]);
  assert.throws(() => parseSemVer('invalid'), /Invalid semver/);
});

test('incrementVersion handles patch, minor and major', () => {
  assert.equal(incrementVersion('2.1.0', 'patch'), '2.1.1');
  assert.equal(incrementVersion('2.1.0', 'minor'), '2.2.0');
  assert.equal(incrementVersion('2.1.0', 'major'), '3.0.0');
  assert.throws(() => incrementVersion('2.1.0', 'other'), /Unknown bump type/);
});

test('isBreakingChange detects exclamation marks and BREAKING CHANGE footer', () => {
  assert.equal(isBreakingChange('feat!: breaking overhaul'), true);
  assert.equal(isBreakingChange('fix(api)!: remove old endpoint'), true);
  assert.equal(
    isBreakingChange('refactor: rewrite data\n\nBREAKING CHANGE: removed deprecated method'),
    true
  );
  assert.equal(
    isBreakingChange('chore: cleanup\n\nBREAKING-CHANGE: changes config format'),
    true
  );
  assert.equal(isBreakingChange('feat: normal feature'), false);
  assert.equal(isBreakingChange('fix: simple bugfix'), false);
});

test('determineBumpType chooses highest severity from commits and PR title', () => {
  // Only patch commits
  assert.equal(determineBumpType(['fix: fix typo', 'chore: update deps']), 'patch');

  // One feat commit promotes to minor
  assert.equal(
    determineBumpType(['fix: bug', 'feat: add dark mode toggle', 'docs: update readme']),
    'minor'
  );

  // PR title feat promotes to minor even if commits are fix
  assert.equal(determineBumpType(['fix: bug'], 'feat: support multiple languages'), 'minor');

  // Breaking change promotes to major even with feat and fix
  assert.equal(
    determineBumpType(['feat: add new API', 'fix!: break backward compatibility']),
    'major'
  );
  assert.equal(
    determineBumpType(['feat: something'], 'refactor!: breaking overhaul (#100)'),
    'major'
  );
});

test('categorizeCommit splits type, scope and description', () => {
  assert.deepEqual(categorizeCommit('feat(ui): add button animation'), {
    type: 'feat',
    scope: 'ui',
    description: 'add button animation',
  });
  assert.deepEqual(categorizeCommit('fix: correct header offset'), {
    type: 'fix',
    scope: '',
    description: 'correct header offset',
  });
  assert.deepEqual(categorizeCommit('arbitrary commit line'), {
    type: 'other',
    scope: '',
    description: 'arbitrary commit line',
  });
});

test('generateReleaseNotes builds clean markdown with sections and compare link', () => {
  const notes = generateReleaseNotes({
    newVersion: '2.2.0',
    prevTag: 'v2.1.0',
    commits: [
      'feat(footer): show release version in footer (#291)',
      'fix: header alignment on mobile (#282)',
      'chore: bump dependencies',
    ],
    prTitle: 'Release v2.2.0: footer version and mobile fixes',
    prNumber: 292,
    repoUrl: 'https://github.com/xdelmo/Portfolio-minimal',
  });

  assert.ok(notes.includes('## v2.2.0'));
  assert.ok(notes.includes('### 📦 Pull Request'));
  assert.ok(notes.includes('Release v2.2.0: footer version and mobile fixes (#292)'));
  assert.ok(notes.includes('### ✨ Features'));
  assert.ok(notes.includes('**footer**: show release version in footer (#291)'));
  assert.ok(notes.includes('### 🐞 Bug Fixes'));
  assert.ok(notes.includes('header alignment on mobile (#282)'));
  assert.ok(notes.includes('### 🛠️ Maintenance & Other Changes'));
  assert.ok(notes.includes('**chore**: bump dependencies'));
  assert.ok(
    notes.includes(
      '**Full Changelog**: https://github.com/xdelmo/Portfolio-minimal/compare/v2.1.0...v2.2.0'
    )
  );
});

test('updatePackageJsonVersion and updatePackageLockVersion update version property', () => {
  const pkgStr = JSON.stringify({ name: 'portfolio', version: '2.1.0' }, null, 2);
  const updatedPkg = updatePackageJsonVersion(pkgStr, '2.2.0');
  assert.equal(JSON.parse(updatedPkg).version, '2.2.0');

  const lockStr = JSON.stringify(
    {
      name: 'portfolio',
      version: '2.1.0',
      packages: {
        '': { version: '2.1.0' },
      },
    },
    null,
    2
  );
  const updatedLock = updatePackageLockVersion(lockStr, '2.2.0');
  const parsedLock = JSON.parse(updatedLock);
  assert.equal(parsedLock.version, '2.2.0');
  assert.equal(parsedLock.packages[''].version, '2.2.0');
});
