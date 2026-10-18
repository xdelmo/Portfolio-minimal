import { test } from 'node:test';
import assert from 'node:assert/strict';
import { missingBrowsers } from './env-check.mjs';

test('the browsers Playwright wants but the disk lacks are named', () => {
  const dryRun = [
    'Chrome for Testing 156.0.8078.4 (playwright chromium v1248)',
    '  Install location:    /cache/chromium-1248',
    '  Download url:        https://cdn.playwright.dev/chrome-mac-arm64.zip',
    '',
    'Chrome Headless Shell 156.0.8078.4 (playwright chromium-headless-shell v1248)',
    '  Install location:    /cache/chromium_headless_shell-1248',
    '',
    'Firefox 157.0 (playwright firefox v1555)',
    '  Install location:    /cache/firefox-1555',
  ].join('\n');
  const onDisk = new Set(['/cache/chromium-1248', '/cache/firefox-1555']);
  assert.deepEqual(missingBrowsers(dryRun, (dir) => onDisk.has(dir)), ['/cache/chromium_headless_shell-1248']);
  assert.deepEqual(missingBrowsers(dryRun, () => true), []);
});
