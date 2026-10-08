#!/usr/bin/env bash
# Runs before every `npm run e2e` (pree2e). Playwright reuses a server already on port 4300: one left by a screenshot,
# another worktree or another session serves a different build, and the run tests the wrong site. Stop instead.
set -uo pipefail
pid=$(lsof -ti tcp:4300 -sTCP:LISTEN 2>/dev/null | head -1)
[ -z "$pid" ] && exit 0
cwd=$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p')
[ "$cwd" = "$PWD" ] && exit 0
echo "e2e: port 4300 is served by pid $pid from ${cwd:-an unknown folder}, not $PWD: stop it (kill $pid) and retry" >&2
exit 1
