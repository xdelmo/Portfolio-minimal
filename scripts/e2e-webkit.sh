#!/usr/bin/env bash
# WebKit and iPhone e2e on a Mac that cannot run them natively (macOS < 15): the same Linux image as CI, through
# Docker (OrbStack). Most red CI runs were WebKit/iPhone failures nobody had seen locally, so `verify` runs this too.
# Run `npm run build` first. Extra arguments go to Playwright: npm run e2e:webkit -- e2e/moai.spec.ts -g "pins"
set -euo pipefail
cd "$(dirname "$0")/.."
# elsewhere (CI, Linux, macOS >= 15) `npm run e2e` already runs these projects
if [ "$(uname)" != Darwin ] || [ "$(uname -r | cut -d. -f1)" -ge 24 ]; then
  echo "e2e:webkit: WebKit runs natively here, inside npm run e2e"
  exit 0
fi
if ! docker info >/dev/null 2>&1; then
  command -v orb >/dev/null && orb start
  docker info >/dev/null 2>&1 || { echo "e2e:webkit: Docker is not running; start OrbStack (or Docker) and retry" >&2; exit 1; }
fi
version=$(node -p "require('@playwright/test/package.json').version")
exec docker run --rm --ipc=host -v "$PWD":/work -w /work "mcr.microsoft.com/playwright:v${version}-noble" \
  npx playwright test --project=webkit --project=iphone "$@"
