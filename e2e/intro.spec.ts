import { expect, test } from './fixtures';

test.describe('intro', () => {
  test.use({ intro: true });

  test('covers the first view, then lifts away by itself', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop only');
    await page.goto('/en/');
    const intro = page.locator('.site-intro');
    await expect(intro).toBeVisible();
    await expect(intro).toHaveAttribute('aria-hidden', 'true');
    await expect(intro).toBeHidden({ timeout: 4000 });
  });

  for (const colorScheme of ['light', 'dark'] as const) {
    test(`hides the page completely in the ${colorScheme} theme`, async ({ page, isMobile }) => {
      test.skip(isMobile, 'desktop only');
      await page.emulateMedia({ colorScheme });
      await page.goto('/en/');
      const background = await page.locator('.site-intro').evaluate((el) => getComputedStyle(el).backgroundColor);
      // rgb() is opaque; rgba() or "rgb(... / a)" would let the page show through
      expect(background).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
    });
  }

  test('never blocks a click', async ({ page }) => {
    await page.goto('/en/');
    await page.getByRole('link', { name: 'See my work' }).click();
    await expect(page).toHaveURL(/#work$/);
  });

  test('is shown once per session', async ({ page }) => {
    await page.goto('/en/');
    await expect(page.locator('.site-intro')).toBeHidden({ timeout: 4000 });
    await page.goto('/en/work/apexflow');
    await expect(page.locator('.site-intro')).toBeHidden();
  });

  test('lifts away even if reduced motion is switched on while it plays', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop only');
    await page.goto('/en/');
    await expect(page.locator('.site-intro')).toBeVisible();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(page.locator('.site-intro')).toBeHidden({ timeout: 5000 });
  });

  // a slow phone or a busy CI: the motion script arrives about 2.4s in, too late to replay the 2s intro without holding
  // the page past the CSS fallback, which then finishes the lift on time
  test('lifts by the CSS fallback time even when the motion script comes late', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop only');
    let loaded = false;
    await page.route('**/*.js', async (route) => {
      if (loaded) await new Promise((resolve) => setTimeout(resolve, 2300));
      await route.continue();
    });
    page.on('load', () => {
      loaded = true;
    });
    await page.goto('/en/');
    await page.waitForFunction(() => !document.documentElement.classList.contains('intro-on'), null, { timeout: 8000 });
    expect(await page.evaluate(() => performance.now())).toBeLessThan(3900);
  });

  // phones skip it: it would delay the first paint, and the page is the point there
  test.describe('on a phone-sized screen', () => {
    test.use({ viewport: { width: 390, height: 844 } });
    test('does not appear', async ({ page }) => {
      await page.goto('/en/');
      // checked at once: waiting would only see the intro after it lifted away
      expect(await page.locator('.site-intro').isVisible()).toBe(false);
    });
  });

  test.describe('with reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });
    test('does not appear', async ({ page }) => {
      await page.goto('/en/');
      await expect(page.locator('.site-intro')).toBeHidden();
    });
  });

  test.describe('without JavaScript', () => {
    test.use({ javaScriptEnabled: false });
    test('does not appear', async ({ page }) => {
      await page.goto('/en/');
      await expect(page.locator('.site-intro')).toBeHidden();
    });
  });
});
