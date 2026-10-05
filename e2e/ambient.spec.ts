import { expect, test, type Page } from './fixtures';

const orbs = (page: Page) => page.locator('app-ambient .orb');
const visibleOrbs = (page: Page) => orbs(page).evaluateAll((els) => els.filter((el) => getComputedStyle(el).display !== 'none').length);
const transforms = (page: Page) => orbs(page).evaluateAll((els) => els.map((el) => getComputedStyle(el).transform).join('|'));
const ready = (page: Page) => expect(page.locator('app-ambient')).toHaveAttribute('data-motion', 'ready');

test('pastel orbs drift behind the page by themselves', async ({ page, isMobile }) => {
  await page.goto('/en/');
  await ready(page);
  expect(await visibleOrbs(page)).toBe(isMobile ? 3 : 5);
  await expect(page.locator('app-ambient')).toHaveAttribute('aria-hidden', 'true');
  const before = await transforms(page);
  await expect.poll(() => transforms(page)).not.toBe(before);
});

test('the pause button stops the orbs', async ({ page }) => {
  await page.goto('/en/');
  await ready(page);
  await page.getByRole('button', { name: 'Pause animations' }).click();
  await page.waitForTimeout(200);
  const still = await transforms(page);
  await page.waitForTimeout(800);
  expect(await transforms(page)).toBe(still);
});

test('the orbs take the tone of the section in view', async ({ page }) => {
  await page.goto('/en/');
  await ready(page);
  await page.locator('#about').scrollIntoViewIfNeeded();
  await expect(page.locator('app-ambient .ambient')).toHaveAttribute('data-tone', 'about');
  await page.locator('#stack').scrollIntoViewIfNeeded();
  await expect(page.locator('app-ambient .ambient')).toHaveAttribute('data-tone', 'stack');
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('there are no orbs', async ({ page }) => {
    await page.goto('/en/');
    await expect(page.locator('app-ambient .ambient')).toBeHidden();
  });
});

test('at the end of the page the orbs still reach the bottom of the screen, with no hard edge', async ({ page }) => {
  await page.goto('/en/');
  await ready(page);
  await page.evaluate(() => { scrollTo(0, document.documentElement.scrollHeight); });
  // the scroll parallax lifts the layer: if it clipped its orbs, its bottom edge would cut them above the fold
  await expect.poll(() => page.locator('app-ambient .ambient').evaluate((el) => {
    const { top, bottom } = el.getBoundingClientRect();
    const clips = getComputedStyle(el).overflow !== 'visible';
    return !clips || (top <= 0 && bottom >= innerHeight);
  })).toBe(true);
});
