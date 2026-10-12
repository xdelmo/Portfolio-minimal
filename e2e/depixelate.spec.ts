import { expect, test } from './fixtures';

// issue #157: the photos load depixelating, as on locomotive.ca, a canvas over each one drawing it in finer steps
test('a project screenshot depixelates as it scrolls in, then shows sharp', async ({ page }) => {
  await page.goto('/en/');
  const shot = page.locator('#work .shot').first();
  // below the hero when the page opens: hidden until its steps start
  await expect(shot).toHaveCSS('opacity', '0');
  const canvases: number[] = [];
  await page.exposeFunction('sawCanvas', (n: number) => canvases.push(n));
  await page.evaluate(() => {
    new MutationObserver(() => {
      const c = document.querySelector('#work .media canvas');
      if (c) void (window as unknown as { sawCanvas: (n: number) => Promise<void> }).sawCanvas((c as HTMLCanvasElement).width);
    }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['width'] });
  });
  await shot.evaluate((el) => { el.scrollIntoView({ block: 'center' }); });
  await expect.poll(() => canvases.length, { timeout: 5000 }).toBeGreaterThan(0);
  // the canvas goes and the photo itself shows
  await expect(page.locator('#work .media canvas')).toHaveCount(0, { timeout: 5000 });
  await expect(shot).toHaveCSS('opacity', '1');
  expect(canvases[0]).toBe(8);
});

// issue #207: drawing the <img> itself decoded the whole JPEG on the main thread at every step, 16 ms each, right as the
// first photo scrolled in under the hero; the steps draw from one bitmap decoded off the main thread
test('the steps draw from a decoded bitmap, never from the photo itself', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { sources: string[] };
    w.sources = [];
    const proto = CanvasRenderingContext2D.prototype;
    const draw = Reflect.get(proto, 'drawImage');
    proto.drawImage = new Proxy(draw, {
      apply(target, self: CanvasRenderingContext2D, args: Parameters<typeof draw>) {
        w.sources.push(args[0].constructor.name);
        Reflect.apply(target, self, args);
      },
    });
  });
  await page.goto('/en/');
  const sources = () => page.evaluate(() => (window as unknown as { sources: string[] }).sources);
  await page.locator('#work .shot').first().evaluate((el) => { el.scrollIntoView({ block: 'center' }); });
  // the canvas comes once the file is decoded: wait for its steps, then for their end
  await expect.poll(async () => (await sources()).length, { timeout: 5000 }).toBeGreaterThan(0);
  await expect(page.locator('#work .media canvas')).toHaveCount(0, { timeout: 5000 });
  expect(new Set(await sources())).toEqual(new Set(['ImageBitmap']));
});

test('the contact photo keeps its pixel circle while it depixelates', async ({ page }) => {
  await page.goto('/en/');
  const photo = page.locator('.contact-photo');
  // the steps last 600 ms: note the canvas's mask the moment it is added
  await page.evaluate(() => {
    const w = window as unknown as { masks: string[] };
    w.masks = [];
    new MutationObserver(() => {
      const c = document.querySelector('.contact canvas');
      if (c) w.masks.push(getComputedStyle(c).maskImage || getComputedStyle(c).getPropertyValue('-webkit-mask-image'));
    }).observe(document.body, { childList: true, subtree: true });
  });
  await photo.evaluate((el) => { el.scrollIntoView({ block: 'center' }); });
  await expect.poll(() => page.evaluate(() => (window as unknown as { masks: string[] }).masks.length), { timeout: 5000 }).toBeGreaterThan(0);
  expect(await page.evaluate(() => (window as unknown as { masks: string[] }).masks[0])).toContain('svg');
  await expect(page.locator('.contact canvas')).toHaveCount(0, { timeout: 5000 });
  await expect(photo).toHaveCSS('opacity', '1');
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('the photos show at once, without a canvas', async ({ page }) => {
    await page.goto('/en/');
    const shot = page.locator('#work .shot').first();
    await expect(shot).toHaveCSS('opacity', '1');
    await shot.evaluate((el) => { el.scrollIntoView({ block: 'center' }); });
    await page.waitForTimeout(300);
    await expect(page.locator('#work .media canvas')).toHaveCount(0);
  });
});
