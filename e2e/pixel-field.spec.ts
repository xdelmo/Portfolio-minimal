import { expect, test, type Page } from '@playwright/test';

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
  await expect(canvas(page)).toBeVisible();
  await expect.poll(() => isPainted(page)).toBe(true);
  const before = await snapshot(page);
  await expect.poll(() => snapshot(page)).not.toBe(before);
});

test('the pause button stops the animation and works from the keyboard', async ({ page }) => {
  await page.goto('/en/');
  const pause = page.getByRole('button', { name: 'Pause the pixel animation' });
  await pause.focus();
  await page.keyboard.press('Enter');
  const play = page.getByRole('button', { name: 'Play the pixel animation' });
  await expect(play).toBeFocused();
  const still = await snapshot(page);
  await page.waitForTimeout(300);
  expect(await snapshot(page)).toBe(still);
  await play.press('Enter');
  await expect(pause).toBeVisible();
});

test('repaints with the new colours when the theme changes while paused', async ({ page }) => {
  await page.goto('/en/');
  await page.getByRole('button', { name: 'Pause the pixel animation' }).click();
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

test('never blocks vertical scrolling on touch screens', async ({ page, browserName, hasTouch }) => {
  test.skip(browserName === 'chromium' && !hasTouch, 'desktop Chromium hides touch-action without touch support');
  await page.goto('/en/');
  expect(await canvas(page).evaluate((c) => getComputedStyle(c).touchAction)).toBe('pan-y');
});

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
    await expect(page.getByRole('button', { name: "Metti in pausa l'animazione dei pixel" })).toHaveCount(0);
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
