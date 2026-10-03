// Renders the still moai used before the 3D scene loads, with reduced motion and when WebGL fails.
// Run after changing the model: node scripts/moai-image.mjs, then update src/app/voxel/moai-image.ts.
import { chromium } from 'playwright';
import { isoSvg } from '../src/app/voxel/iso.ts';
import { moaiVoxels } from '../src/app/voxel/moai.model.ts';

const UNIT = 16; // CSS px per voxel edge
const palette = {
  stone: '#a3a39d',
  stoneDark: '#85857f',
  stoneLight: '#bdbdb6',
  eye: '#0066d4',
  pukao: '#ffc9a8',
  moss: '#a8e0c8',
};

const svg = isoSvg(moaiVoxels(), palette, UNIT);
const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 2 });
await page.setContent(`<body style="margin:0;background:transparent">${svg}</body>`);
const figure = page.locator('svg');
await figure.screenshot({ path: 'public/images/moai.png', omitBackground: true });
const box = await figure.boundingBox();
await browser.close();
console.log(`public/images/moai.png: ${String(box?.width)} × ${String(box?.height)} CSS px (2x pixels)`);
