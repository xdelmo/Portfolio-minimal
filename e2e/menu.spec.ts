import { expect, test } from './fixtures';

// issue #128: on phones the header's links sit behind a menu button
test.describe('the phone menu', () => {
  test('opens the sections, lands on the one chosen and closes', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'phones');
    await page.goto('/en/');
    const header = page.locator('app-site-header');
    await header.locator('.site-menu summary').click();
    const menu = header.getByRole('navigation', { name: 'Main' });
    await expect(menu.getByRole('link')).toHaveText(['Work', 'About', 'Experience', 'Contact']);
    await menu.getByRole('link', { name: 'Contact' }).click();
    await expect(page).toHaveURL(/#contact$/);
    await expect(menu).toBeHidden();
    // the section is under the sticky header, not behind it
    await expect
      .poll(() => page.locator('#contact h2').evaluate((h) => Math.round(h.getBoundingClientRect().top)))
      .toBeGreaterThan(0);
    await expect.poll(() => page.locator('#contact h2').evaluate((h) => h.getBoundingClientRect().top < innerHeight)).toBe(true);
  });

  test('Escape and a tap outside close it', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'phones');
    await page.goto('/it/');
    const header = page.locator('app-site-header');
    const button = header.locator('app-site-menu summary');
    await button.click();
    await expect(header.getByRole('navigation', { name: 'Principale' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(header.getByRole('navigation', { name: 'Principale' })).toBeHidden();
    await expect(button).toBeFocused();
    await button.click();
    // a tap on the page below the open menu (the menu itself covers the top of the hero on short phones)
    const { width, height } = page.viewportSize() ?? { width: 390, height: 664 };
    await page.mouse.click(width / 2, height - 24);
    await expect(header.getByRole('navigation', { name: 'Principale' })).toBeHidden();
  });

  test('closes when the focus leaves it, so it never covers the focused control', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'phones');
    await page.goto('/en/');
    const header = page.locator('app-site-header');
    await header.locator('.site-menu summary').click();
    const menu = header.getByRole('navigation', { name: 'Main' });
    await menu.getByRole('link', { name: 'Contact' }).focus();
    await page.getByRole('link', { name: 'See my work' }).focus();
    await expect(menu).toBeHidden();
  });

  test('on desktop the links are in the header and there is no menu button', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop');
    await page.goto('/en/');
    await expect(page.locator('app-site-menu')).toBeHidden();
    await expect(page.locator('app-site-header header > nav').getByRole('link', { name: 'Work' })).toBeVisible();
  });
});
