#!/usr/bin/env bash
# The last step of `verify`: every e2e spec this branch adds or changes runs 5 more times, WebKit and iPhone in CI's
# image as in e2e:webkit. A test that depends on timing and fails one time in ten fails here, before the pull request.
set -euo pipefail
cd "$(dirname "$0")/.."
base=$(git merge-base HEAD origin/v2 2>/dev/null || true)
[ -z "$base" ] && { echo "e2e:changed: no origin/v2 to compare with"; exit 0; }
specs=()
while IFS= read -r spec; do specs+=("$spec"); done < <(git diff --name-only --diff-filter=AM "$base" -- 'e2e/*.spec.ts')
[ ${#specs[@]} -eq 0 ] && { echo "e2e:changed: no e2e spec changed"; exit 0; }
echo "e2e:changed: ${specs[*]} ×5"
npx playwright test "${specs[@]}" --repeat-each=5 --project=chromium --project=firefox --project=android
# ponytail: on macOS >= 15 e2e-webkit.sh exits early, so WebKit is not repeated there; pass the projects to the
# line above if that machine ever comes back
bash scripts/e2e-webkit.sh "${specs[@]}" --repeat-each=5
