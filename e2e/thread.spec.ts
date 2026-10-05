import { expect, test, type Page } from './fixtures';

const thread = (page: Page) => page.locator('app-thread .thread');
const lit = (page: Page) => page.locator('app-thread .node.is-lit');

test('a pixel thread runs down the page and lights a node per section as it reaches it', async ({ page }) => {
  await page.goto('/en/');
  await expect(thread(page)).toBeVisible();
  await expect(page.locator('app-thread .node')).toHaveCount(5);
  await expect.poll(() => lit(page).count()).toBeLessThanOrEqual(1);

  await page.locator('#experience h2').evaluate((el) => {
    window.scrollTo(0, el.getBoundingClientRect().top + scrollY - innerHeight * 0.3);
  });
  // work, side quests and about are behind; stack still ahead
  await expect.poll(() => lit(page).count()).toBeGreaterThanOrEqual(3);
  expect(await lit(page).count()).toBeLessThan(5);

  await page.evaluate(() => {
    window.scrollTo(0, document.documentElement.scrollHeight);
  });
  await expect.poll(() => lit(page).count()).toBe(5);
});

test('the thread ends where the contact band begins: the finale is the arrival, not one more stop', async ({ page }) => {
  await page.goto('/en/');
  await expect(thread(page)).toBeVisible();
  const threadBottom = await thread(page).evaluate((el) => el.getBoundingClientRect().bottom + scrollY);
  const contactTop = await page.locator('#contact').evaluate((el) => el.getBoundingClientRect().top + scrollY);
  expect(threadBottom).toBeLessThanOrEqual(contactTop + 0.5); // sub-pixel rounding in Firefox
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('there is no thread', async ({ page }) => {
    await page.goto('/en/');
    await page.waitForTimeout(500);
    await expect(thread(page)).toBeHidden();
  });
});
