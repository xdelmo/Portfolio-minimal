#!/usr/bin/env bash
# WebKit and iPhone e2e where Playwright's WebKit cannot be trusted natively: macOS < 15 (its WebKit build is frozen)
# and Linux hosts outside CI (the Linux PC runs Ubuntu 26.04, where WebKit launches but canvas animations never
# advance). Runs them in the same Linux image as CI, through Docker (OrbStack on the Mac). Most red CI runs were
# WebKit/iPhone failures nobody had seen locally, so `verify` runs this too.
# Run `npm run build` first. Extra arguments go to Playwright: npm run e2e:webkit -- e2e/moai.spec.ts -g "pins"
set -euo pipefail
cd "$(dirname "$0")/.."
# in CI and on macOS >= 15 `npm run e2e` already runs these projects
if [ -n "${CI:-}" ] || { [ "$(uname)" = Darwin ] && [ "$(uname -r | cut -d. -f1)" -ge 24 ]; }; then
  echo "e2e:webkit: WebKit runs natively here, inside npm run e2e"
  exit 0
fi
if ! docker info >/dev/null 2>&1; then
  command -v orb >/dev/null && orb start
  docker info >/dev/null 2>&1 || { echo "e2e:webkit: Docker is not running; start OrbStack (or Docker) and retry" >&2; exit 1; }
fi
version=$(node -p "require('@playwright/test/package.json').version")
# on Linux the container would write test-results as root
user=()
[ "$(uname)" = Linux ] && user=(--user "$(id -u):$(id -g)" -e HOME=/tmp)
exec docker run --rm --ipc=host ${user[@]+"${user[@]}"} -e PW_WEBKIT=1 -v "$PWD":/work -w /work "mcr.microsoft.com/playwright:v${version}-noble" \
  npx playwright test --project=webkit --project=iphone "$@"
