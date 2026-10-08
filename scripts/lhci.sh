#!/usr/bin/env bash
# Lighthouse CI against the built site (lighthouserc.json). On the Linux PC there is no system Chrome, so it uses the
# Chromium Playwright installed, and Chrome's sandbox is blocked there (Ubuntu 26.04 restricts user namespaces), so it
# runs without it. CI and the Mac run it as before.
set -euo pipefail
cd "$(dirname "$0")/.."
args=()
if [ "$(uname)" = Linux ] && [ -z "${CI:-}" ]; then
  [ -n "${CHROME_PATH:-}" ] || CHROME_PATH=$(node -p "require('playwright').chromium.executablePath()")
  export CHROME_PATH
  args=(--collect.settings.chromeFlags="--headless=new --no-sandbox")
fi
exec npx lhci autorun ${args[@]+"${args[@]}"}
