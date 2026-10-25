// The first step of `verify` (issue #214): node_modules must match the lockfile and Playwright's browsers must be the
// ones this branch's Playwright asks for. A branch switch left both behind on 2026-10-17, and verify found out only at
// the e2e, ten minutes in; this finds out in a second.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

/** The folders `playwright install --dry-run` names that are not on disk. */
export function missingBrowsers(dryRun, exists = existsSync) {
  return [...dryRun.matchAll(/^\s*Install location:\s*(.+?)\s*$/gm)].map((m) => m[1]).filter((dir) => !exists(dir));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const problems = [];
  try {
    execFileSync('npm', ['ls', '--depth=0'], { stdio: 'pipe' });
  } catch {
    problems.push('node_modules does not match package-lock.json: run `npm ci`');
  }
  const dryRun = execFileSync('npx', ['playwright', 'install', '--dry-run', 'chromium', 'firefox'], { encoding: 'utf8' });
  const missing = missingBrowsers(dryRun);
  if (missing.length) problems.push(`Playwright browsers missing (${missing.join(', ')}): run \`npx playwright install chromium firefox\``);
  for (const problem of problems) console.error(`env-check: ${problem}`);
  process.exit(problems.length ? 1 : 0);
}
