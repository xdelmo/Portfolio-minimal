import { expect, test, type Page } from './fixtures';

const canvas = (page: Page) => page.locator('app-pixel-field canvas');
const snapshot = (page: Page) => canvas(page).evaluate((c) => (c as HTMLCanvasElement).toDataURL());
const isPainted = (page: Page) =>
  canvas(page).evaluate((c) => {
    const el = c as HTMLCanvasElement;
    const blank = document.createElement('canvas');
    blank.width = el.width;
    blank.height = el.height;
    return el.toDataURL() !== blank.toDataURL();
  });

test('draws the field and keeps it moving', async ({ page }) => {
  await page.goto('/en/');
  // on short phones the field starts below the fold, where it rightly stops drawing
  await canvas(page).scrollIntoViewIfNeeded();
  await expect(canvas(page)).toBeVisible();
  await expect.poll(() => isPainted(page)).toBe(true);
  const before = await snapshot(page);
  await expect.poll(() => snapshot(page)).not.toBe(before);
});

test('repaints with the new colours when the theme changes while paused', async ({ page }) => {
  await page.goto('/en/');
  await page.getByRole('button', { name: 'Pause animations' }).click();
  const before = await snapshot(page);
  await page.getByRole('button', { name: /Switch to (light|dark) theme/ }).click();
  await expect.poll(() => snapshot(page)).not.toBe(before);
});

test('stops drawing when scrolled out of view', async ({ page }) => {
  await page.goto('/en/');
  await expect.poll(() => isPainted(page)).toBe(true);
  await page.locator('footer').scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  const away = await snapshot(page);
  await page.waitForTimeout(300);
  expect(await snapshot(page)).toBe(away);
});

test('stays sharp after the window is resized', async ({ page }) => {
  await page.goto('/en/');
  await page.setViewportSize({ width: 375, height: 800 });
  await expect
    .poll(() =>
      canvas(page).evaluate((c) => {
        const el = c as HTMLCanvasElement;
        return el.width - Math.round(el.clientWidth * Math.min(window.devicePixelRatio, 2));
      }),
    )
    .toBe(0);
});

test('never blocks scrolling or pinch-zoom on touch screens', async ({ page }) => {
  await page.goto('/en/');
  // Chromium reports the default as an empty string, the others as "auto"
  expect(['', 'auto']).toContain(await canvas(page).evaluate((c) => getComputedStyle(c).touchAction));
});

for (const [width, height] of [
  [1024, 768],
  [1280, 800],
  [1440, 900],
] as const) {
  test(`keeps the hero buttons in the first screen at ${String(width)}×${String(height)}`, async ({ page, isMobile }) => {
    test.skip(isMobile, 'laptop sizes');
    await page.setViewportSize({ width, height });
    await page.goto('/en/');
    await expect(page.getByRole('link', { name: 'See my work' })).toBeInViewport({ ratio: 1 });
  });
}

test('does not shift the layout while it starts', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'layout-shift entries exist only in Chromium');
  await page.goto('/en/');
  await expect.poll(() => isPainted(page)).toBe(true);
  const shift = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        let total = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) total += (entry as PerformanceEntry & { value: number }).value;
        }).observe({ type: 'layout-shift', buffered: true });
        setTimeout(() => {
          resolve(total);
        }, 200);
      }),
  );
  expect(shift).toBe(0);
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('shows a still picture and no pause button', async ({ page }) => {
    await page.goto('/it/');
    await expect.poll(() => isPainted(page)).toBe(true);
    await expect(page.getByRole('button', { name: 'Metti in pausa le animazioni' })).toHaveCount(0);
    const still = await snapshot(page);
    await page.waitForTimeout(300);
    expect(await snapshot(page)).toBe(still);
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('keeps the hero text and the space for the field', async ({ page }) => {
    await page.goto('/en/');
    await expect(page.locator('h1')).toBeVisible();
    const box = await page.locator('app-pixel-field').boundingBox();
    expect(box?.height).toBeGreaterThan(150);
  });
});

test.describe('the face', () => {
  // counts the canvas pixels in the peach of the skin (--px-6), the colour only the portrait uses at full size
  const peach = (page: Page) =>
    canvas(page).evaluate((c) => {
      const el = c as HTMLCanvasElement;
      const css = getComputedStyle(document.documentElement).getPropertyValue('--px-6').trim();
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(css.slice(i, i + 2), 16));
      const data = el.getContext('2d')?.getImageData(0, 0, el.width, el.height).data ?? new Uint8ClampedArray();
      let n = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 200 && Math.abs(data[i] - r) < 8 && Math.abs(data[i + 1] - g) < 8 && Math.abs(data[i + 2] - b) < 8) n++;
      }
      return n;
    });

  test('the field draws the face from the start, with no "edm." scene', async ({ page }) => {
    await page.goto('/en/');
    await canvas(page).scrollIntoViewIfNeeded();
    await expect.poll(() => peach(page), { timeout: 4000 }).toBeGreaterThan(500);
    await expect(page.locator('app-pixel-field')).not.toHaveAttribute('data-scene');
  });

  test.describe('with reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });
    test('the still picture is the face', async ({ page }) => {
      await page.goto('/en/');
      await canvas(page).scrollIntoViewIfNeeded();
      await expect.poll(() => peach(page)).toBeGreaterThan(500);
    });
  });
});
