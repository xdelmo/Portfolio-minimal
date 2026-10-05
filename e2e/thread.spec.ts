import { expect, test, type Page } from './fixtures';

const thread = (page: Page) => page.locator('app-thread .thread');
const lit = (page: Page) => page.locator('app-thread .node.is-lit');

test('a pixel thread runs down the page and lights a node per section as it reaches it', async ({ page }) => {
  await page.goto('/en/');
  await expect(thread(page)).toBeVisible();
  await expect(page.locator('app-thread .node')).toHaveCount(6);
  await expect.poll(() => lit(page).count()).toBeLessThanOrEqual(1);

  await page.locator('#experience h2').evaluate((el) => {
    window.scrollTo(0, el.getBoundingClientRect().top + scrollY - innerHeight * 0.3);
  });
  // work, side quests and about are behind; stack and contact still ahead
  await expect.poll(() => lit(page).count()).toBeGreaterThanOrEqual(3);
  expect(await lit(page).count()).toBeLessThan(6);

  await page.evaluate(() => {
    window.scrollTo(0, document.documentElement.scrollHeight);
  });
  await expect.poll(() => lit(page).count()).toBe(6);
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('there is no thread', async ({ page }) => {
    await page.goto('/en/');
    await page.waitForTimeout(500);
    await expect(thread(page)).toBeHidden();
  });
});
