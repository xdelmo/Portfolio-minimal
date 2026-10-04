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

test.describe('edm. becomes the face', () => {
  const host = (page: Page) => page.locator('app-pixel-field');

  test('turns into the face by itself, then back into edm.', async ({ page }) => {
    await page.goto('/en/');
    await canvas(page).scrollIntoViewIfNeeded();
    await expect(host(page)).toHaveAttribute('data-scene', 'edm');
    await expect(host(page)).toHaveAttribute('data-scene', 'face', { timeout: 12_000 });
    await expect(host(page)).toHaveAttribute('data-scene', 'edm', { timeout: 8000 });
  });

  test('a click or a tap swaps the scene', async ({ page }) => {
    await page.goto('/en/');
    await canvas(page).scrollIntoViewIfNeeded();
    // the canvas listens once it has painted its first frame
    await expect.poll(() => isPainted(page)).toBe(true);
    // a mouse reaching the field already brings the face: settle wherever the pointer leaves it first
    await canvas(page).hover({ position: { x: 10, y: 10 } });
    await page.waitForTimeout(1500);
    const before = await host(page).getAttribute('data-scene');
    await canvas(page).click({ position: { x: 10, y: 10 } });
    await expect(host(page)).toHaveAttribute('data-scene', before === 'face' ? 'edm' : 'face');
  });

  test('the mouse over the field holds the face', async ({ page, isMobile }) => {
    test.skip(isMobile, 'no hover on touch screens');
    await page.goto('/en/');
    await canvas(page).hover({ position: { x: 20, y: 20 } });
    await expect(host(page)).toHaveAttribute('data-scene', 'face');
    await page.waitForTimeout(5000);
    await expect(host(page)).toHaveAttribute('data-scene', 'face');
    await page.mouse.move(0, 0);
    await expect(host(page)).toHaveAttribute('data-scene', 'edm');
  });
});
