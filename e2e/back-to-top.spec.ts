import { expect, test } from './fixtures';

// issue #129: on phones a button in the corner takes long pages back up
test('on phones a back-to-top button shows after a screen and a half and goes back up', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phones');
  await page.goto('/en/');
  const button = page.getByRole('button', { name: 'Back to top' });
  await expect(button).toHaveCount(0);
  await page.evaluate(() => {
    window.scrollTo(0, innerHeight * 3);
  });
  await expect(button).toBeVisible();
  await button.click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.locator('main')).toBeFocused();
  await expect(button).toHaveCount(0);
});

test('on desktop there is no back-to-top button in the corner', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop');
  await page.goto('/en/');
  await page.evaluate(() => {
    window.scrollTo(0, innerHeight * 3);
  });
  await expect(page.locator('app-back-to-top button')).toBeHidden();
});
