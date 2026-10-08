import { expect, test } from './fixtures';

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

test('a scrambling menu link never wraps onto two lines', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the menu is hidden on phones');
  await page.goto('/it/');
  await expect(page.locator('app-pixel-cursor')).toHaveAttribute('data-motion', 'ready');
  const link = page.getByRole('navigation').getByRole('link', { name: 'Chi sono' });
  const height = (await link.boundingBox())?.height ?? 0;
  // force wide letters: every scramble frame draws "m"
  await page.evaluate(() => {
    Math.random = () => 12 / 26;
  });
  let tallest = 0;
  for (let i = 0; i < 3; i++) {
    await link.hover();
    for (let f = 0; f < 8; f++) {
      tallest = Math.max(tallest, (await link.boundingBox())?.height ?? 0);
      await page.waitForTimeout(25);
    }
    await page.mouse.move(5, 300);
    await page.waitForTimeout(450);
  }
  expect(tallest).toBeLessThanOrEqual(height + 1);
});

// A click pressed and released while the letters shuffle still follows the link. Replacing the link's text node
// between mousedown and mouseup left WebKit without a target for the click, so a quick click did nothing (Safari).
test('a menu link clicked while its letters shuffle still navigates', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the menu is hidden on phones');
  await page.goto('/en/work/apexflow');
  await expect(page.locator('app-pixel-cursor')).toHaveAttribute('data-motion', 'ready');
  const link = page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Experience' });
  const box = await link.boundingBox();
  if (!box) throw new Error('no menu link');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  // more than one shuffle step (45 ms) between press and release
  await page.waitForTimeout(100);
  await page.mouse.up();
  await expect(page).toHaveURL(/\/en\/#experience$/);
});
