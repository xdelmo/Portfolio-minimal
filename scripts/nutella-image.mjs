// Renders the still Nutella (light and dark theme colours, from src/styles/_tokens.scss) used before the 3D scene
// loads, with reduced motion, reduced data and when WebGL fails.
// Run after changing the model: npm run nutella:image.
import { chromium } from 'playwright';
import { isoBounds, isoFaces, isoShadow, isoSvg } from '../src/app/voxel/iso.ts';
import { NUTELLA_FRAME, nutellaShadowCells, nutellaVoxels } from '../src/app/voxel/nutella.model.ts';

const SIZE = 256; // CSS px (square, matching the 3D camera)
// --moai-shadow per theme, baked into the still so the page bundle carries no shadow code
const shadows = { nutella: 'rgb(29 29 28 / 0.16)', 'nutella-dark': 'rgb(0 0 0 / 0.5)' };
const palettes = {
  nutella: { cream: '#e9d3ad', white: '#f3eee6', tan: '#d6a468', saddle: '#4a4643', ear: '#f0d9cf', black: '#16120f' },
  'nutella-dark': { cream: '#d4bf9c', white: '#ddd8d0', tan: '#c2945d', saddle: '#45413e', ear: '#dbc5bc', black: '#16120f' },
};

const voxels = nutellaVoxels();
const bounds = isoBounds(isoFaces(voxels));
const side = Math.max(bounds.width, bounds.height) * NUTELLA_FRAME;
const unit = SIZE / side;
const ox = Math.round((((side - bounds.width) / 2) * unit) * 10) / 10;
const oy = Math.round((((side - bounds.height) / 2) * unit) * 10) / 10;

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 2 });
let box = null;
for (const [name, palette] of Object.entries(palettes)) {
  // the ground shadow goes first, under the figure, inside the inner svg so coordinates match
  const shadow = `<path fill="${shadows[name]}" d="${isoShadow(nutellaShadowCells(voxels), voxels, unit, 1)}"/>`;
  const inner = isoSvg(voxels, palette, unit, 1)
    .replace('<svg ', `<svg x="${String(ox)}" y="${String(oy)}" overflow="visible" `)
    .replace(/(<svg[^>]*>)/, `$1${shadow}`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${String(SIZE)}" height="${String(SIZE)}" viewBox="0 0 ${String(SIZE)} ${String(SIZE)}">${inner}</svg>`;
  await page.setContent(`<body style="margin:0;background:transparent">${svg}</body>`);
  const figure = page.locator('svg').first();
  await figure.screenshot({ path: `public/images/${name}.png`, omitBackground: true });
  box = await figure.boundingBox();
}
await browser.close();
console.log(`public/images/nutella.png and nutella-dark.png: ${String(box?.width)} × ${String(box?.height)} CSS px (2x pixels)`);
