// After a release, removes the branches and worktrees whose work is provably in: a pull request merged it and the
// branch's tip is still that pull request's head. A worktree goes only if it sits on such a branch, is clean,
// unlocked, not the main checkout, no running process has its cwd inside it and no kept worktree is nested in it.
// Never master, devel, v2 or archive/*: release branches stay on origin (issue #448).
// `node scripts/cleanup-branches.mjs` prints the plan, `--apply` carries it out.
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const KEPT = /^(master|devel|v2|archive\/.+)$/;

const inside = (path, dir) => path === dir || path.startsWith(dir + '/');

/**
 * prs: merged pull requests [{ head, oid }]; local, remote: [{ name, oid }];
 * worktrees: [{ path, branch, oid, main, locked, dirty }]; busy: cwds of running processes.
 */
export function planCleanup({ prs, local, remote, worktrees, busy }) {
  const merged = new Set(prs.map((pr) => `${pr.head} ${pr.oid}`));
  const done = (name, oid) => Boolean(name) && !KEPT.test(name) && merged.has(`${name} ${oid}`);

  let removable = worktrees.filter(
    (w) => !w.main && !w.locked && !w.dirty && done(w.branch, w.oid) && !busy.some((cwd) => inside(cwd, w.path)),
  );
  // a worktree holding a kept one inside its folder would take it along
  for (let changed = true; changed; ) {
    const kept = worktrees.filter((w) => !removable.includes(w));
    const next = removable.filter((w) => !kept.some((k) => k.path !== w.path && inside(k.path, w.path)));
    changed = next.length !== removable.length;
    removable = next;
  }
  const checkedOut = new Set(worktrees.filter((w) => !removable.includes(w)).map((w) => w.branch));

  return {
    worktrees: removable.map((w) => w.path).sort((a, b) => b.length - a.length),
    local: local.filter((b) => done(b.name, b.oid) && !checkedOut.has(b.name)).map((b) => b.name),
    remote: remote.filter((b) => done(b.name, b.oid)).map((b) => b.name),
  };
}

/** `git worktree list --porcelain` → [{ path, branch, oid, main, locked }] */
export function parseWorktrees(porcelain) {
  return porcelain
    .trim()
    .split(/\n\n+/)
    .map((block, i) => {
      const line = (key) => block.split('\n').find((l) => l === key || l.startsWith(key + ' '));
      return {
        path: line('worktree').slice('worktree '.length),
        oid: line('HEAD')?.slice('HEAD '.length),
        branch: line('branch')?.slice('branch refs/heads/'.length),
        main: i === 0,
        locked: Boolean(line('locked')),
      };
    });
}

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' });
const refs = (prefix, strip) =>
  git('for-each-ref', prefix, '--format=%(refname) %(objectname)')
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((l) => l.split(' '))
    .map(([ref, oid]) => ({ name: ref.slice(strip.length), oid }));

function processCwds() {
  try {
    return execFileSync('lsof', ['-a', '-d', 'cwd', '-Fn'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
      .split('\n')
      .filter((l) => l.startsWith('n/'))
      .map((l) => l.slice(1));
  } catch (error) {
    // lsof exits 1 when it could not read some processes, with the readable ones on stdout
    if (error.stdout) return error.stdout.split('\n').filter((l) => l.startsWith('n/')).map((l) => l.slice(1));
    throw new Error('lsof is needed to tell which worktrees are in use', { cause: error });
  }
}

function run(apply) {
  git('fetch', '--prune', '--quiet', 'origin');
  git('worktree', 'prune');
  const prs = JSON.parse(
    execFileSync('gh', ['pr', 'list', '--state', 'merged', '--limit', '1000', '--json', 'headRefName,headRefOid'], {
      encoding: 'utf8',
    }),
  ).map((pr) => ({ head: pr.headRefName, oid: pr.headRefOid }));
  const worktrees = parseWorktrees(git('worktree', 'list', '--porcelain')).map((w) => ({
    ...w,
    dirty: !w.main && git('-C', w.path, 'status', '--porcelain').trim() !== '',
  }));
  const plan = planCleanup({
    prs,
    local: refs('refs/heads', 'refs/heads/'),
    remote: refs('refs/remotes/origin', 'refs/remotes/origin/').filter((b) => b.name !== 'HEAD'),
    worktrees,
    busy: [...processCwds(), process.cwd()],
  });

  console.log(`worktrees (${plan.worktrees.length}):`, ...plan.worktrees.map((p) => `\n  ${p}`));
  console.log(`local branches (${plan.local.length}):`, plan.local.join(' '));
  console.log(`remote branches (${plan.remote.length}):`, plan.remote.join(' '));
  if (!apply) return console.log('\nplan only: run again with --apply to remove them');

  let failed = 0;
  const attempt = (args) => {
    try {
      git(...args);
    } catch (error) {
      failed++;
      console.error(`kept: git ${args.join(' ')}\n  ${String(error.stderr ?? error.message).trim()}`);
    }
  };
  for (const path of plan.worktrees) attempt(['worktree', 'remove', path]);
  // -D safely deletes branches confirmed merged via PRs; a branch whose worktree could not go is refused by git itself
  for (const name of plan.local) attempt(['branch', '-D', name]);
  if (plan.remote.length) attempt(['push', 'origin', '--delete', ...plan.remote]);
  git('worktree', 'prune');
  console.log(failed ? `\ndone with ${failed} step(s) kept, see above` : '\ndone');
  process.exitCode = failed ? 1 : 0;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) run(process.argv.includes('--apply'));
