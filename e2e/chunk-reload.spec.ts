import { expect, test } from './fixtures';

// a page change whose chunk cannot be fetched (a deploy since the page was opened) loads that page instead (issue #429)
test('a page change whose chunk is gone loads the page from the server', async ({ page }) => {
  await page.goto('/en/privacy/');
  await page.route('**/chunk-*.js', (route) => route.abort());
  await page.locator('.more a').click();
  await expect(page).toHaveURL(/\/en\/$/);
  await expect(page.locator('h1').first()).toBeVisible();
});
