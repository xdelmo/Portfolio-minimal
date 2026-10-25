// Every branch says what it does before the slash (feat/404-page, fix/hero-lede), so a merge is recognisable from
// its name alone. `node scripts/branch-name.mjs <name>` checks one name (CI, for a pull request's branch);
// `--pre-push` reads the refs git hands the pre-push hook, checks every branch being pushed and refuses a direct push to
// a long-lived branch: those change only through a pull request (ALLOW_PROTECTED_PUSH=1 lets the owner through).
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const PREFIXES = ['feat', 'fix', 'docs', 'chore', 'ci', 'test', 'refactor', 'perf', 'style', 'build'];
// the long-lived branches, and the archived copy of the Gatsby site
const KEPT = /^(v2|master|devel|archive\/.+)$/;
export const PROTECTED = ['v2', 'master', 'devel'];

export function validBranch(name) {
  return KEPT.test(name) || new RegExp(`^(${PREFIXES.join('|')})/[a-z0-9][a-z0-9.-]*$`).test(name);
}

/** The branches a push creates or updates; deleting an old branch is always allowed. */
export function pushedBranches(stdin) {
  return stdin
    .split('\n')
    .map((line) => line.trim().split(/\s+/))
    .filter(([, localSha, remoteRef]) => remoteRef?.startsWith('refs/heads/') && !/^0+$/.test(localSha))
    .map(([, , remoteRef]) => remoteRef.slice('refs/heads/'.length));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const names = process.argv[2] === '--pre-push' ? pushedBranches(readFileSync(0, 'utf8')) : process.argv.slice(2);
  const wrong = names.filter((name) => !validBranch(name));
  for (const name of wrong) {
    console.error(`branch "${name}" needs a prefix that says what it does: ${PREFIXES.join('/, ')}/ then a-z, 0-9 and dashes (feat/404-page)`);
  }
  const guarded = process.argv[2] === '--pre-push' && process.env.ALLOW_PROTECTED_PUSH !== '1';
  const direct = guarded ? names.filter((name) => PROTECTED.includes(name)) : [];
  for (const name of direct) console.error(`direct push to ${name} refused: open a pull request into it`);
  process.exit(wrong.length || direct.length ? 1 : 0);
}
