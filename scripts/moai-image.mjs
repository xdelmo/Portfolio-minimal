// Renders the still moai (light and dark theme colours, from src/styles/_tokens.scss) used before the 3D scene loads, with reduced motion and when WebGL fails.
// Run after changing the model: node scripts/moai-image.mjs, then update src/app/voxel/moai-image.ts.
import { chromium } from 'playwright';
import { isoSvg } from '../src/app/voxel/iso.ts';
import { MOAI_FRAME, moaiVoxels } from '../src/app/voxel/moai.model.ts';

const UNIT = 16; // CSS px per voxel edge
const palettes = {
  moai: { stone: '#a3a39d', stoneDark: '#85857f', stoneLight: '#bdbdb6', eye: '#0066d4', pukao: '#ffc9a8', moss: '#bdbdb6' },
  'moai-dark': { stone: '#7d7d78', stoneDark: '#62625e', stoneLight: '#9a9a94', eye: '#0066d4', pukao: '#f0a982', moss: '#9a9a94' },
};

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 2 });
let box = null;
for (const [name, palette] of Object.entries(palettes)) {
  await page.setContent(`<body style="margin:0;background:transparent">${isoSvg(moaiVoxels(), palette, UNIT, MOAI_FRAME)}</body>`);
  const figure = page.locator('svg');
  await figure.screenshot({ path: `public/images/${name}.png`, omitBackground: true });
  box = await figure.boundingBox();
}
await browser.close();
console.log(`public/images/moai.png and moai-dark.png: ${String(box?.width)} × ${String(box?.height)} CSS px (2x pixels)`);
