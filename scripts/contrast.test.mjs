import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const tokensCss = readFileSync('src/styles/_tokens.scss', 'utf8');
const baseCss = readFileSync('src/styles/_base.scss', 'utf8');

function extractBlock(css, marker) {
  const start = css.indexOf(marker);
  assert.notEqual(start, -1, `Missing marker ${marker}`);
  const open = css.indexOf('{', start);
  let depth = 1;
  let i = open + 1;
  while (i < css.length && depth > 0) {
    if (css[i] === '{') depth += 1;
    else if (css[i] === '}') depth -= 1;
    i += 1;
  }
  return css.slice(open + 1, i - 1);
}

function parseTokens(block) {
  const map = new Map();
  for (const match of block.matchAll(/(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*;/g)) {
    map.set(match[1], match[2].toLowerCase());
  }
  return map;
}

function srgbChannel(hexPair) {
  const v = parseInt(hexPair, 16) / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const r = srgbChannel(hex.slice(1, 3));
  const g = srgbChannel(hex.slice(3, 5));
  const b = srgbChannel(hex.slice(5, 7));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  const light = Math.max(la, lb);
  const dark = Math.min(la, lb);
  return (light + 0.05) / (dark + 0.05);
}

const light = parseTokens(extractBlock(tokensCss, ':root[data-theme=\'light\']'));
const dark = parseTokens(extractBlock(tokensCss, '@mixin dark-tokens'));

describe('non-text UI accent contrast (issue #599)', () => {
  for (const [theme, tokens] of [
    ['light', light],
    ['dark', dark],
  ]) {
    it(`${theme} theme --accent-line meets WCAG 1.4.11 (>= 3:1) on page, surface, and bands`, () => {
      const accentLine = tokens.get('--accent-line');
      assert.ok(accentLine, `${theme} missing --accent-line`);

      assert.ok(contrastRatio(accentLine, tokens.get('--bg')) >= 3, `${theme} --accent-line on --bg < 3:1`);
      assert.ok(contrastRatio(accentLine, tokens.get('--surface')) >= 3, `${theme} --accent-line on --surface < 3:1`);

      for (const band of ['pastel', 'lavender', 'ink']) {
        const bg = tokens.get(`--band-${band}-bg`);
        const bandLine = tokens.get(`--band-${band}-link`);
        assert.ok(bg && bandLine, `${theme} missing --band-${band} tokens`);
        assert.ok(
          contrastRatio(bandLine, bg) >= 3,
          `${theme} .band--${band} --accent-line (${bandLine}) vs ${bg} < 3:1`,
        );
      }
    });
  }

  it('re-points --accent-line inside every .band--* rule in _base.scss', () => {
    for (const band of ['pastel', 'lavender', 'ink']) {
      const block = extractBlock(baseCss, `.band--${band} {`);
      assert.match(block, new RegExp(`--accent-line:\\s*var\\(--band-${band}-link\\)`));
    }
  });

  it('uses --accent-line rather than --accent on non-text UI indicators', () => {
    const indicatorFiles = [
      'src/app/game/player-card/player-card.scss',
      'src/app/pages/not-found/not-found.scss',
      'src/app/core/i18n/language-switch/language-switch.scss',
      'src/app/layout/thread/thread.scss',
      'src/app/game/game-trigger.ts',
      'src/app/sections/experience-timeline/experience-timeline.scss',
      'src/app/pages/case-study/case-study.scss',
      'src/app/sections/stack-list/stack-list.scss',
      'src/app/layout/pixel-cursor.ts',
    ];
    for (const file of indicatorFiles) {
      const text = readFileSync(file, 'utf8');
      assert.doesNotMatch(text, /var\(--accent\)/, `${file} still references var(--accent) instead of var(--accent-line)`);
      assert.match(text, /var\(--accent-line\)/, `${file} must reference var(--accent-line)`);
    }
  });
});
