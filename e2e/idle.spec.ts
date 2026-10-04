import { expect, test, type Page } from './fixtures';

const ready = (page: Page) => expect(page.locator('app-home [data-motion]')).toHaveAttribute('data-motion', 'ready');
const orbTranslate = (page: Page) => page.locator('#stack .orb').evaluateAll((els) => els.map((el) => getComputedStyle(el).translate).join('|'));

test('the stack orbs float on their own and stop with the pause button', async ({ page }) => {
  await page.goto('/en/');
  await ready(page);
  await page.locator('#stack .orbs').scrollIntoViewIfNeeded();
  const before = await orbTranslate(page);
  await expect.poll(() => orbTranslate(page)).not.toBe(before);
  await page.getByRole('button', { name: 'Pause animations' }).click();
  await page.waitForTimeout(600);
  const still = await orbTranslate(page);
  await page.waitForTimeout(800);
  expect(await orbTranslate(page)).toBe(still);
});

test('a stack orb steps aside from the pointer', async ({ page, isMobile }) => {
  test.skip(isMobile, 'mouse only');
  await page.goto('/en/');
  await ready(page);
  await page.getByRole('button', { name: 'Pause animations' }).click();
  const orb = page.locator('#stack .orb').first();
  await orb.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  await orb.hover({ position: { x: 10, y: 10 } });
  await expect.poll(() => orb.evaluate((el) => Math.hypot(...getComputedStyle(el).translate.split(' ').map((v) => parseFloat(v) || 0)))).toBeGreaterThan(4);
});

test('menu links scramble their letters on hover, but keep their real name', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the menu is hidden on phones');
  await page.goto('/en/');
  await expect(page.locator('app-pixel-cursor')).toHaveAttribute('data-motion', 'ready');
  const link = page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Experience' });
  await link.hover();
  await expect.poll(() => link.textContent(), { timeout: 1000, intervals: [20] }).not.toBe('Experience');
  await expect(link).toHaveAccessibleName('Experience');
  await expect(link).toHaveText('Experience');
});
