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
  // the page past the CSS fallback, which then finishes the lift
  test('leaves the lift to the CSS when the motion script comes too late to replay it', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop only');
    // only the chunk that carries GSAP comes late, whenever it is asked for
    await page.route('**/*.js', async (route) => {
      const response = await route.fetch();
      if ((await response.text()).includes('GreenSock')) await new Promise((resolve) => setTimeout(resolve, 2300));
      await route.fulfill({ response });
    });
    // GSAP takes over by switching the CSS lift off on the panel: watch for it from the first render
    await page.addInitScript(() => {
      new MutationObserver(() => {
        const panel = document.querySelector<HTMLElement>('.site-intro');
        if (panel?.style.animationName === 'none') Object.assign(window, { replayed: true });
      }).observe(document, { subtree: true, attributes: true, attributeFilter: ['style'] });
    });
    await page.goto('/en/');
    await page.waitForFunction(() => !document.documentElement.classList.contains('intro-on'), null, { timeout: 10000 });
    // too late to replay without holding the page past the CSS lift: the CSS finished it
    expect(await page.evaluate(() => 'replayed' in window)).toBe(false);
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
