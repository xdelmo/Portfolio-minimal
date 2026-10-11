import { expect, test, type Page } from './fixtures';

// issue #128: on phones the header's links sit behind a menu button
test.describe('the phone menu', () => {
  test('opens the sections, lands on the one chosen and closes', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'phones');
    await page.goto('/en/');
    const header = page.locator('app-site-header');
    await header.locator('.site-menu summary').click();
    const menu = header.getByRole('navigation', { name: 'Main' });
    await expect(menu.getByRole('link')).toHaveText(['Work', 'About', 'Experience', 'Contact', 'Blog']);
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

  // issue #183: GSAP rolls it up in pixel steps before it closes; measured in the page, not by how fast Playwright acts
  const closingTime = (page: Page) =>
    page.locator('details.site-menu').evaluate(
      (menu: HTMLDetailsElement) =>
        new Promise<number>((resolve) => {
          const from = performance.now();
          menu.addEventListener(
            'toggle',
            () => {
              resolve(performance.now() - from);
            },
            { once: true },
          );
          menu.querySelector('summary')?.click();
        }),
    );

  test('the open menu rolls up before it closes, and opens again if pressed meanwhile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'phones');
    await page.goto('/en/');
    const summary = page.locator('.site-menu summary');
    const menu = page.locator('app-site-header').getByRole('navigation', { name: 'Main' });
    // GSAP comes after the first paint: once it is in, closing takes its steps
    await expect
      .poll(async () => {
        await summary.click();
        await expect(menu).toBeVisible();
        return closingTime(page);
      })
      .toBeGreaterThanOrEqual(100);
    await expect(menu).toBeHidden();
    // pressed again while it rolls up, it stays open, whole
    await summary.click();
    await expect(menu).toBeVisible();
    const open = await page.locator('details.site-menu').evaluate(async (details: HTMLDetailsElement) => {
      const summary = details.querySelector('summary');
      summary?.click();
      await new Promise((resolve) => setTimeout(resolve, 40));
      summary?.click();
      await new Promise((resolve) => setTimeout(resolve, 400));
      const nav = details.querySelector('nav');
      return { open: details.open, clip: nav ? getComputedStyle(nav).clipPath : '' };
    });
    expect(open).toEqual({ open: true, clip: 'none' });
  });

  test('with reduced motion it closes at once', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'phones');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/en/');
    await page.locator('.site-menu summary').click();
    await page.waitForTimeout(500);
    expect(await closingTime(page)).toBeLessThan(60);
  });

  test('on desktop the links are in the header and there is no menu button', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop');
    await page.goto('/en/');
    await expect(page.locator('app-site-menu')).toBeHidden();
    await expect(page.locator('app-site-header header > nav').getByRole('link', { name: 'Work' })).toBeVisible();
  });
});
