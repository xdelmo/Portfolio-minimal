// Renders the still avatar (light and dark theme colours, from src/styles/_tokens.scss) shown in the hero before the 3D scene draws, with reduced motion and when WebGL fails.
// Run after changing the model: node scripts/avatar-image.mjs, then update src/app/avatar/avatar-image.ts.
import { Buffer } from 'node:buffer';
import { writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { isoSvg } from '../src/app/voxel/iso.ts';
import { AVATAR_FRAME, avatarVoxels } from '../src/app/avatar/avatar.model.ts';

const UNIT = 9; // CSS px per voxel edge: the tallest slot (desktop) is 448px
const palettes = {
  avatar: { skin: '#e0a987', lips: '#c47a68', beard: '#3b2f2a', frames: '#2b211c', lens: '#f2f2f2', eye: '#1d1d1c', metal: '#c9c9c9', top: '#2e2e2e', sleeve: '#3b3b3b', pants: '#34507a', shoes: '#f2f2f2' },
  'avatar-dark': { skin: '#c79274', lips: '#a8685a', beard: '#4a3c35', frames: '#3a2e28', lens: '#d9d9d4', eye: '#121212', metal: '#a8a8a8', top: '#4a4a4a', sleeve: '#575757', pants: '#3f5f8f', shoes: '#cfcfcf' },
};

const browser = await chromium.launch();
const page = await browser.newPage();
/* global Image, document -- the function below runs in the browser */
let size = null;
for (const [name, palette] of Object.entries(palettes)) {
  // WebP from a canvas: a fifth of the PNG's bytes, and the hero loads it during the first paint
  const result = await page.evaluate(async (svg) => {
    const image = new Image();
    image.src = `data:image/svg+xml,${encodeURIComponent(svg)}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.width * 2;
    canvas.height = image.height * 2;
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
    return { width: image.width, height: image.height, data: canvas.toDataURL('image/webp', 0.75) };
  }, isoSvg(avatarVoxels(), palette, UNIT, AVATAR_FRAME));
  writeFileSync(`public/images/${name}.webp`, Buffer.from(result.data.split(',')[1], 'base64'));
  size = result;
}
await browser.close();
console.log(`public/images/avatar.webp and avatar-dark.webp: ${String(size?.width)} × ${String(size?.height)} CSS px (2x pixels)`);
