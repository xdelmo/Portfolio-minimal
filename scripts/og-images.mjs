// Renders the 1200×630 Open Graph images (spec §8), one per page and language, into public/og/.
// Run after changing a title, a summary or the list of projects: npm run og:images
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { CONTENT_EN } from '../src/app/content/content.en.ts';
import { CONTENT_IT } from '../src/app/content/content.it.ts';
import { glyph, hash } from '../src/app/pixel-field/field.ts';

// light theme colours, from src/styles/_tokens.scss
const BG = '#e5e5e5';
const FG = '#1d1d1c';
const MUTED = '#555555';
const PIXELS = ['#0066d4', '#7fb2ec', '#b9d5f5', '#c9b8f5', '#a8e0c8', '#ffc9a8'];
const FONT = readFileSync('node_modules/@fontsource-variable/instrument-sans/files/instrument-sans-latin-wght-normal.woff2').toString('base64');
const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

// "edm." in pastel pixels, like the hero field, over a faint dot grid
const COLS = 21, ROWS = 28, CELL = 22, DOT = 16;
const g = glyph('edm.');
const scale = Math.max(1, Math.floor((COLS - 2) / g.width));
const lit = new Set();
for (const [x, y] of g.cells) for (let i = 0; i < scale; i++) for (let j = 0; j < scale; j++) lit.add(`${String(1 + x * scale + i)},${String(Math.floor((ROWS - g.height * scale) / 2) + y * scale + j)}`);
let dots = '';
for (let y = 0; y < ROWS; y++) {
  for (let x = 0; x < COLS; x++) {
    const on = lit.has(`${String(x)},${String(y)}`);
    const fill = on ? PIXELS[Math.floor(hash(x * 31 + y) * PIXELS.length)] : FG;
    dots += `<rect x="${String(x * CELL)}" y="${String(y * CELL)}" width="${String(DOT)}" height="${String(DOT)}" fill="${fill}" opacity="${on ? '1' : '0.08'}"/>`;
  }
}
const field = `<svg width="${String(COLS * CELL)}" height="${String(ROWS * CELL)}" viewBox="0 0 ${String(COLS * CELL)} ${String(ROWS * CELL)}">${dots}</svg>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const [locale, c] of [['en', CONTENT_EN], ['it', CONTENT_IT]]) {
  const cards = [['home', c.person.name, c.hero.headline], ...c.projects.map((p) => [p.slug, p.title, p.summary])];
  for (const [key, title, line] of cards) {
    await page.setContent(`<style>
      @font-face { font-family: 'Instrument Sans'; src: url(data:font/woff2;base64,${FONT}) format('woff2'); font-weight: 400 700; }
      body { margin: 0; width: 1200px; height: 630px; overflow: hidden; background: ${BG}; color: ${FG}; font-family: 'Instrument Sans'; display: flex; }
      main { flex: 1; padding: 64px 0 64px 72px; display: flex; flex-direction: column; justify-content: space-between; }
      h1 { margin: 0; font-size: 76px; line-height: 1.04; letter-spacing: -0.02em; font-weight: 700; }
      p { margin: 28px 0 0; font-size: 32px; line-height: 1.3; color: ${MUTED}; max-width: 20em; }
      footer { font-size: 28px; font-weight: 600; }
      svg { flex: none; margin: 0 40px 0 24px; align-self: center; }
    </style>
    <main><div><h1>${escape(title)}</h1><p>${escape(line)}</p></div><footer>${escape(c.person.name)}, ${escape(c.person.role)}</footer></main>${field}`);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `public/og/${locale}-${key}.png` });
  }
}
await browser.close();
console.log('public/og: done');
