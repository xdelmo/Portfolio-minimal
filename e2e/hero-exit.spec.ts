import { expect, test, type Page } from './fixtures';

// issue #593: leaving, the hero's text fades, the cloud closes over the clearing, then cloud and seam crumble together
const exit = (page: Page) => page.locator('.hero app-pixel-field canvas').evaluate((c) => (c as HTMLElement).dataset['exit'] ?? null);
const opacity = (page: Page) => page.locator('.hero .copy').evaluate((el) => parseFloat(getComputedStyle(el).opacity));
const seamP = (page: Page) =>
  page.locator('.hero .seam--hero').evaluate((el) => parseFloat(getComputedStyle(el).getPropertyValue('--p') || '1'));
// scrolls to a fraction of the hero's height (its scroll range runs from its top to its bottom at the top of the window)
const scrollHero = (page: Page, fraction: number) =>
  page.locator('.hero').evaluate((el, f) => {
    window.scrollTo(0, el.getBoundingClientRect().top + scrollY + el.offsetHeight * f);
  }, fraction);

for (const [width, height] of [
  [1440, 900],
  [390, 844],
] as const) {
  test(`at ${String(width)}×${String(height)} the hero closes and crumbles as it scrolls away, and comes back`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/en/');
    await expect(page.locator('app-home [data-motion]')).toHaveAttribute('data-motion', 'ready');
    await expect.poll(() => exit(page)).not.toBe('1.00');
    expect(await opacity(page)).toBe(1);

    await scrollHero(page, 0.5);
    await expect.poll(async () => parseFloat((await exit(page)) ?? '0')).toBeGreaterThan(0);
    await expect.poll(() => opacity(page)).toBeLessThan(1);

    await scrollHero(page, 1);
    await expect.poll(() => exit(page)).toBe('1.00');
    await expect.poll(() => opacity(page)).toBe(0);
    await expect.poll(() => seamP(page)).toBe(0);

    await page.evaluate(() => { window.scrollTo(0, 0); });
    await expect.poll(() => exit(page)).toBe('0.00');
    await expect.poll(() => opacity(page)).toBe(1);
    await expect.poll(() => seamP(page)).toBe(1);
  });
}

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('the hero scrolls away as it is', async ({ page }) => {
    await page.goto('/en/');
    await scrollHero(page, 1);
    await page.waitForTimeout(500);
    expect(await opacity(page)).toBe(1);
    expect(await exit(page)).toBeNull();
  });
});
