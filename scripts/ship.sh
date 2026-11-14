#!/bin/sh
# Ships the current branch: push, PR into devel (arguments go to `gh pr create`, e.g.
# --title "…" --body-file f.md), wait for the Actions checks, merge commit only on green.
# Exit 0 = merged. Not for release PRs (devel → master): those keep their branch and need the user's yes.
set -eu
branch=$(git branch --show-current)
case "$branch" in devel|master) echo "ship: refusing to ship $branch" >&2; exit 1 ;; esac

# Docs travel with the change (issue #542): code changed and no doc did → stop and ask.
# SHIP_NO_DOCS=1 says the change makes no doc stale.
git fetch -q origin devel
changed=$(git diff --name-only "$(git merge-base origin/devel HEAD)" HEAD)
if [ "${SHIP_NO_DOCS:-}" != 1 ] && printf '%s\n' "$changed" | grep -Eq '^(src|scripts|e2e|\.github|\.githooks)/|^(package\.json|angular\.json|netlify\.toml|lighthouserc\.json)$' \
  && ! printf '%s\n' "$changed" | grep -Eq '^[^/]+\.md$|^(docs|handbook|\.claude/skills)/'; then
  echo "ship: code changed but no doc did. Update the docs this change makes stale (CLAUDE.md, DESIGN.md," >&2
  echo "      edm-style, CODING_STANDARDS.md, handbook/, the spec's §17), or rerun with SHIP_NO_DOCS=1 if none is." >&2
  exit 1
fi

git push -q -u origin "$branch"
gh pr view --json number >/dev/null 2>&1 || gh pr create --base devel "$@"
pr=$(gh pr view --json number -q .number)
sha=$(git rev-parse HEAD)

# A PR can show only Netlify's checks because no Actions workflow started (CLAUDE.md, 2026-11-08):
# wait up to 10 minutes for the head commit's runs, then stop instead of merging without CI.
i=0
# a failed gh api call (network, rate limit) prints its error and counts as no run yet (issue #549)
until [ "$(gh api "repos/{owner}/{repo}/actions/runs?head_sha=$sha" -q .total_count || echo 0)" -gt 0 ]; do
  i=$((i + 1))
  [ "$i" -le 20 ] || { echo "ship: no Actions run started for $sha on PR #$pr; push a new non-empty commit" >&2; exit 1; }
  sleep 30
done

sleep 10 # let the runs register their checks on the PR
if gh pr checks "$pr" --watch --fail-fast >/dev/null; then
  gh pr merge "$pr" --merge --delete-branch
  echo "ship: PR #$pr merged into devel"
else
  gh pr checks "$pr" | grep -v pass >&2 || true
  echo "ship: PR #$pr has failing checks; fix them on the branch" >&2
  exit 1
fi
