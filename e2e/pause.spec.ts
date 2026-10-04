import { expect, test, type Page } from './fixtures';

const pause = (page: Page) => page.getByRole('button', { name: 'Pause animations' });
const field = (page: Page) => page.locator('app-pixel-field canvas');
const snapshot = (page: Page) => field(page).evaluate((c) => (c as HTMLCanvasElement).toDataURL());

test('one header button pauses all automatic motion, from the keyboard too', async ({ page }) => {
  await page.goto('/en/');
  await expect(page.getByRole('button', { name: 'Pause the pixel animation' })).toHaveCount(0);
  await expect(pause(page)).toHaveAttribute('aria-pressed', 'false');
  await pause(page).focus();
  await page.keyboard.press('Enter');
  await expect(pause(page)).toHaveAttribute('aria-pressed', 'true');
  const still = await snapshot(page);
  await page.waitForTimeout(400);
  expect(await snapshot(page)).toBe(still);
  await page.keyboard.press('Enter');
  await expect(pause(page)).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(() => snapshot(page)).not.toBe(still);
});

test('the pause lasts across pages for the whole visit', async ({ page }) => {
  await page.goto('/en/');
  await pause(page).click();
  await page.goto('/en/work/apexflow');
  await expect(pause(page)).toHaveAttribute('aria-pressed', 'true');
  await page.goto('/en/');
  await expect(pause(page)).toHaveAttribute('aria-pressed', 'true');
  const still = await snapshot(page);
  await page.waitForTimeout(400);
  expect(await snapshot(page)).toBe(still);
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('there is nothing to pause, so there is no button', async ({ page }) => {
    await page.goto('/en/');
    await expect(page.locator('app-site-header')).toBeVisible();
    await expect(pause(page)).toHaveCount(0);
  });
});
