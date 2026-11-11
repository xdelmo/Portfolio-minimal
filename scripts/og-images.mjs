// Renders the 1200×630 Open Graph images (spec §8), one per page and language, into public/og/: the hero's own
// composition, its pixel cloud round a clearing that holds the title and the byline (the link preview already shows
// the description), the moai in the corner as the signature.
// Run after changing a title, a summary or the list of projects: npm run og:images
/* global document -- the evaluate callbacks run in the page */
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { BLOG } from '../src/app/content/blog.generated.ts';
import { CONTENT_EN } from '../src/app/content/content.en.ts';
import { CONTENT_IT } from '../src/app/content/content.it.ts';
import { voices } from '../src/app/content/voices.ts';
import { moaiShadow } from '../src/app/voxel/moai.model.ts';
import { CLOUD_CELL, cloudDepth, hash, layout, tone } from '../src/app/pixel-field/field.ts';

const W = 1200, H = 630;
// dark theme colours, from src/styles/_tokens.scss
const BG = '#121212';
const FG = 'rgb(255 255 255 / 0.87)';
const MUTED = '#aaaaaa';
const PIXELS = ['#0066d4', '#2f86ea', '#6aa9f2', '#9d8cf0', '#c2b4f5', '#f0a982'];
const CLOUD_ALPHA = 0.78;
const b64 = (path) => readFileSync(path).toString('base64');
const SANS = b64('node_modules/@fontsource-variable/instrument-sans/files/instrument-sans-latin-wdth-normal.woff2');
const SERIF = b64('node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2');
const MOAI = b64('public/images/moai.png');
// the moai's ground shadow, in the still image's own pixels (288 × 655), dark theme's --moai-shadow
const SHADOW = `<svg class="shadow" viewBox="0 0 288 655" shape-rendering="crispEdges" fill="rgb(0 0 0 / 0.5)">${moaiShadow().map((r) => `<rect x="${String(r.x)}" y="${String(r.y)}" width="${String(r.w)}" height="8"/>`).join('')}</svg>`;
const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

/** The hero's cloud round the text's line boxes; `seed` shifts the noise so every page gets its own sky. */
function cloud(boxes, seed) {
  const l = layout(W, H);
  const shift = Math.floor(hash(seed) * 4096);
  let rects = '';
  for (let row = 0; row < l.rows; row++) {
    for (let col = 0; col < l.cols; col++) {
      const depth = cloudDepth(col, row, l, boxes, shift);
      if (depth <= 0) continue;
      const shade = hash(((col - shift) * 37 + row * 67 + 3) & 0xffff);
      rects += `<rect x="${String(l.x0 + col * CLOUD_CELL)}" y="${String(l.y0 + row * CLOUD_CELL)}" width="${String(CLOUD_CELL)}" height="${String(CLOUD_CELL)}" fill="${PIXELS[tone(depth, shade, col, row)]}"/>`;
    }
  }
  return `<svg width="${String(W)}" height="${String(H)}" shape-rendering="crispEdges" opacity="${String(CLOUD_ALPHA)}">${rects}</svg>`;
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
for (const [locale, c] of [['en', CONTENT_EN], ['it', CONTENT_IT]]) {
  const [method, voice] = voices(c.hero.headline, c.hero.voice);
  const cards = [
    ['home', `${escape(method)} <em>${escape(voice)}</em>`],
    ...c.projects.map((p) => [p.slug, escape(p.title)]),
    ['blog', 'Blog'],
    ...BLOG[locale].map((a) => [`blog-${a.slug}`, escape(a.title)]),
  ];
  for (const [key, title] of cards) {
    await page.setContent(`<style>
      @font-face { font-family: 'Instrument Sans'; src: url(data:font/woff2;base64,${SANS}) format('woff2'); font-weight: 400 700; font-stretch: 75% 100%; }
      @font-face { font-family: 'Instrument Serif'; src: url(data:font/woff2;base64,${SERIF}) format('woff2'); font-style: italic; }
      body { margin: 0; width: ${String(W)}px; height: ${String(H)}px; overflow: hidden; background: ${BG}; color: ${FG}; font-family: 'Instrument Sans'; }
      svg, img { position: absolute; }
      img, .shadow { right: 32px; bottom: 32px; height: 160px; width: ${String((160 * 288) / 655)}px; }
      main { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
      h1 { margin: 0; max-width: 600px; font-size: 72px; line-height: 1.08; font-weight: 600; font-variation-settings: 'wdth' 100; letter-spacing: -0.01em; text-wrap: balance; }
      em { font-family: 'Instrument Serif'; font-weight: 400; font-size: 1.14em; line-height: 0.9; }
      p { margin: 32px 0 0; max-width: 560px; font-size: 32px; line-height: 1.3; letter-spacing: 0.01em; color: ${MUTED}; text-wrap: balance; }
    </style>
    ${SHADOW}<img alt="" src="data:image/png;base64,${MOAI}"><main><h1>${title}</h1><p>${escape(`${c.person.name}, ${c.person.role}`)}</p></main>`);
    await page.evaluate('document.fonts.ready.then(() => true)');
    // three lines at most: long Italian titles step down a size
    const boxes = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      for (let size = 72; size > 48 && h1.getBoundingClientRect().height > size * 1.08 * 3 + 1; size -= 8) h1.style.fontSize = `${String(size - 8)}px`;
      return [...document.querySelectorAll('h1, p')].flatMap((el) => {
        const range = document.createRange();
        range.selectNodeContents(el);
        return [...range.getClientRects()].map((r) => ({ x: r.x, y: r.y, w: r.width, h: r.height }));
      });
    });
    await page.evaluate((svg) => document.body.insertAdjacentHTML('afterbegin', svg), cloud(boxes, [...key].reduce((n, ch) => n * 31 + ch.charCodeAt(0), 7) & 0xffff));
    await page.screenshot({ path: `public/og/${locale}-${key}.png` });
  }
}
await browser.close();
console.log('public/og: done');
