// Release automation script (PR merge -> package.json bump + git tag + GitHub release)
// Reads commits since last tag, determines SemVer bump from Conventional Commits,
// updates package.json / package-lock.json, creates git tag and GitHub release.

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const PACKAGE_JSON = 'package.json';
export const PACKAGE_LOCK_JSON = 'package-lock.json';

const SEMVER = /^(\d+)\.(\d+)\.(\d+)(?:-([\w.-]+))?$/;

/**
 * Validates and parses SemVer string into [major, minor, patch].
 */
export function parseSemVer(version) {
  const match = SEMVER.exec(version);
  if (!match) {
    throw new Error(`Invalid semver version: ${JSON.stringify(version)}`);
  }
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/**
 * Increments SemVer version according to bump type ('major', 'minor', 'patch').
 */
export function incrementVersion(version, bumpType) {
  const [major, minor, patch] = parseSemVer(version);
  switch (bumpType) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      throw new Error(`Unknown bump type: ${bumpType}`);
  }
}

/**
 * Checks if a commit message indicates a breaking change.
 */
export function isBreakingChange(message) {
  return (
    /^[a-z]+(\([^)]+\))?!:/.test(message) ||
    /^BREAKING[- ]CHANGE:/im.test(message)
  );
}

/**
 * Analyzes commit messages and PR title to determine the SemVer bump ('major' | 'minor' | 'patch').
 */
export function determineBumpType(commits, prTitle = '') {
  const allMessages = [...commits, prTitle].filter(Boolean);

  if (allMessages.some((msg) => isBreakingChange(msg))) {
    return 'major';
  }

  const isMinor = allMessages.some((msg) => /^feat(\([^)]+\))?:/i.test(msg));
  if (isMinor) {
    return 'minor';
  }

  return 'patch';
}

/**
 * Categorizes a commit message into Conventional Commits groups.
 */
export function categorizeCommit(message) {
  const firstLine = message.split('\n')[0].trim();
  const match = /^([a-z]+)(?:\(([^)]+)\))?!?: (.+)$/i.exec(firstLine);
  if (!match) {
    return { type: 'other', scope: '', description: firstLine };
  }
  return {
    type: match[1].toLowerCase(),
    scope: match[2] || '',
    description: match[3],
  };
}

/**
 * Generates formatted Markdown release notes.
 */
export function generateReleaseNotes({
  newVersion,
  prevTag,
  commits = [],
  prTitle = '',
  prNumber = null,
  repoUrl = 'https://github.com/xdelmo/Portfolio-minimal',
}) {
  const features = [];
  const fixes = [];
  const others = [];

  for (const commit of commits) {
    const trimmed = commit.trim();
    if (!trimmed || trimmed.startsWith('chore(release):')) continue;
    const cat = categorizeCommit(trimmed);
    let prefix = '';
    if (cat.scope) {
      prefix = `**${cat.scope}**: `;
    } else if (cat.type !== 'feat' && cat.type !== 'fix' && cat.type !== 'other') {
      prefix = `**${cat.type}**: `;
    }
    const line = `${prefix}${cat.description}`;
    if (cat.type === 'feat') {
      features.push(line);
    } else if (cat.type === 'fix') {
      fixes.push(line);
    } else {
      others.push(line);
    }
  }

  const sections = [];
  sections.push(`## v${newVersion}`);

  if (prTitle) {
    const prRef = prNumber ? ` (#${prNumber})` : '';
    sections.push(`\n### 📦 Pull Request\n- ${prTitle}${prRef}`);
  }

  if (features.length > 0) {
    sections.push(`\n### ✨ Features\n` + features.map((f) => `- ${f}`).join('\n'));
  }

  if (fixes.length > 0) {
    sections.push(`\n### 🐞 Bug Fixes\n` + fixes.map((f) => `- ${f}`).join('\n'));
  }

  if (others.length > 0) {
    sections.push(`\n### 🛠️ Maintenance & Other Changes\n` + others.map((o) => `- ${o}`).join('\n'));
  }

  if (prevTag) {
    sections.push(`\n**Full Changelog**: ${repoUrl}/compare/${prevTag}...v${newVersion}`);
  }

  return sections.join('\n');
}

/**
 * Updates version in package.json and package-lock.json strings.
 */
export function updatePackageJsonVersion(pkgJsonContent, newVersion) {
  const data = JSON.parse(pkgJsonContent);
  data.version = newVersion;
  return JSON.stringify(data, null, 2) + '\n';
}

export function updatePackageLockVersion(pkgLockContent, newVersion) {
  const data = JSON.parse(pkgLockContent);
  data.version = newVersion;
  if (data.packages && data.packages['']) {
    data.packages[''].version = newVersion;
  }
  return JSON.stringify(data, null, 2) + '\n';
}

/**
 * Executes a git command safely and returns standard output trimmed.
 */
function git(args, options = {}) {
  return execFileSync('git', args, { encoding: 'utf8', ...options }).trim();
}

/**
 * Gets the latest semver tag (v*).
 */
export function getLatestSemverTag(ref = 'master') {
  try {
    return execFileSync(
      'git',
      ['describe', '--tags', '--abbrev=0', '--match', 'v*', ref],
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
    ).trim();
  } catch {
    try {
      const allTags = execFileSync(
        'git',
        ['tag', '-l', 'v*', '--sort=-v:refname'],
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
      ).trim();
      return allTags ? allTags.split('\n')[0].trim() : '';
    } catch {
      return '';
    }
  }
}

/**
 * CLI execution entrypoint
 */
export async function main(argv = process.argv.slice(2)) {
  const dryRun = argv.includes('--dry-run');
  const prIndex = argv.indexOf('--pr-number');
  const prNumber = prIndex !== -1 ? argv[prIndex + 1] : null;
  const bumpIndex = argv.indexOf('--bump');
  const explicitBump = bumpIndex !== -1 ? argv[bumpIndex + 1] : null;

  // 1. Get latest semver tag
  const prevTag = getLatestSemverTag('HEAD');

  // 2. Determine commits and PR info
  let commits = [];
  let prTitle = '';

  if (prNumber) {
    try {
      const prJson = execFileSync(
        'gh',
        ['pr', 'view', prNumber, '--json', 'title,commits'],
        { encoding: 'utf8' }
      );
      const prData = JSON.parse(prJson);
      prTitle = prData.title || '';
      if (Array.isArray(prData.commits)) {
        commits = prData.commits.map((c) => c.messageHeadline || '').filter(Boolean);
      }
    } catch {
      // fallback if gh CLI fails
    }
  }

  if (commits.length === 0) {
    const gitLogArgs = prevTag
      ? ['log', `${prevTag}..HEAD`, '--oneline']
      : ['log', '-n', '20', '--oneline'];
    const rawLog = git(gitLogArgs);
    commits = rawLog
      ? rawLog
          .split('\n')
          .map((line) => line.replace(/^[a-f0-9]+\s+/, '').trim())
          .filter(Boolean)
      : [];
  }

  // 3. Get current version from package.json
  const currentPkgRaw = readFileSync(PACKAGE_JSON, 'utf8');
  const currentPkg = JSON.parse(currentPkgRaw);
  const currentVersion = currentPkg.version;

  // 5. Determine bump type & calculate next version
  const bumpType = explicitBump || determineBumpType(commits, prTitle);
  const newVersion = incrementVersion(currentVersion, bumpType);
  const nextTag = `v${newVersion}`;

  console.log(`Current version: ${currentVersion}`);
  console.log(`Detected bump:   ${bumpType}`);
  console.log(`Target version:  ${newVersion} (${nextTag})`);
  console.log(`Commits count:   ${commits.length}`);

  // 6. Generate release notes
  const notes = generateReleaseNotes({
    newVersion,
    prevTag,
    commits,
    prTitle,
    prNumber,
  });

  if (dryRun) {
    console.log('\n--- DRY RUN: Release Notes ---');
    console.log(notes);
    console.log('------------------------------');
    console.log('Dry run complete. No files changed, no tags created.');
    return { currentVersion, newVersion, nextTag, bumpType, notes };
  }

  // 7. Update package.json & package-lock.json
  const updatedPkg = updatePackageJsonVersion(currentPkgRaw, newVersion);
  writeFileSync(PACKAGE_JSON, updatedPkg, 'utf8');

  try {
    const currentLockRaw = readFileSync(PACKAGE_LOCK_JSON, 'utf8');
    const updatedLock = updatePackageLockVersion(currentLockRaw, newVersion);
    writeFileSync(PACKAGE_LOCK_JSON, updatedLock, 'utf8');
  } catch {
    // lock file might not exist or be optional
  }

  // 8. Generate version file (scripts/version.mjs)
  execFileSync('node', ['scripts/version.mjs']);

  // 9. Git commit & tag
  execFileSync('git', ['add', PACKAGE_JSON, PACKAGE_LOCK_JSON]);
  execFileSync('git', ['commit', '-m', `chore(release): ${nextTag} [skip ci]`]);
  execFileSync('git', ['tag', '-a', nextTag, '-m', `Release ${nextTag}`]);

  // 10. Push to remote
  const pushEnv = { ...process.env, ALLOW_PROTECTED_PUSH: '1' };
  execFileSync('git', ['push', 'origin', 'master'], { env: pushEnv });
  execFileSync('git', ['push', 'origin', nextTag], { env: pushEnv });

  // 11. Create GitHub Release
  execFileSync('gh', ['release', 'create', nextTag, '--title', nextTag, '--notes', notes]);

  console.log(`✅ Successfully published release ${nextTag} on package and GitHub!`);
  return { currentVersion, newVersion, nextTag, bumpType, notes };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error('Release failed:', err);
    process.exit(1);
  });
}
