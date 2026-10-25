// WCAG 1.4.3 over the ambient orbs (src/app/layout/ambient.ts). axe cannot read a contrast through a radial
// gradient, so this checks the worst case from the tokens: text over the centre of every orb at its strongest.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const tokens = readFileSync('src/styles/_tokens.scss', 'utf8');
const ambient = readFileSync('src/app/layout/ambient.ts', 'utf8');

function block(theme) {
  const start = tokens.indexOf(theme === 'light' ? ":root[data-theme='light']" : ":root[data-theme='dark']");
  return tokens.slice(start, tokens.indexOf('}', start));
}
function token(theme, name) {
  const m = block(theme).match(new RegExp(`${name}:\\s*([^;]+);`));
  if (!m) throw new Error(`${name} missing in ${theme}`);
  return m[1].trim();
}
function rgba(value) {
  if (value.startsWith('#')) return [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16)).concat(1);
  const m = value.match(/rgb\((\d+) (\d+) (\d+) \/ ([\d.]+)\)/);
  return [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])];
}
const over = ([r, g, b, a], [R, G, B]) => [r * a + R * (1 - a), g * a + G * (1 - a), b * a + B * (1 - a)];
const lum = (c) => {
  const [r, g, b] = c.map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// the strongest weight a section tone gives an orb
const maxWeight = Math.max(1, ...[...ambient.matchAll(/--w:\s*([\d.]+)/g)].map((m) => Number(m[1])));

for (const theme of ['light', 'dark']) {
  test(`text keeps 4.5:1 over the ambient orbs, ${theme} theme`, () => {
    const bg = rgba(token(theme, '--bg'));
    const alpha = Number(token(theme, '--ambient-alpha')) * maxWeight;
    for (const orb of ['--px-2', '--px-3', '--px-4', '--px-5', '--px-6']) {
      const [r, g, b] = rgba(token(theme, orb));
      const behind = over([r, g, b, alpha], bg);
      for (const text of ['--fg', '--fg-muted', '--link']) {
        const c = ratio(over(rgba(token(theme, text)), behind), behind);
        assert.ok(c >= 4.5, `${text} over ${orb}: ${c.toFixed(2)}`);
      }
    }
  });
}
