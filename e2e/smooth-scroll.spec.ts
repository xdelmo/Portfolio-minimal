import { expect, test, type Page } from './fixtures';

// issue #159: smooth scroll with GSAP ScrollSmoother, on desktop with a mouse only
// GSAP's lag smoothing advances its clock by at most ~33 ms a frame: on a busy machine (200 ms frames) the one-second
// glide takes about six, so waiting for the content to rest allows 15 s
const REST_MS = 15_000;

const contentY = (page: Page) =>
  page.evaluate(() => new DOMMatrix(getComputedStyle(document.getElementById('smooth-content') ?? document.body).transform).m42);

test.describe('smooth scroll on desktop', () => {
  test.use({ smoothScroll: true });
  test.skip(({ isMobile }) => isMobile, 'touch keeps the native scroll');

  test('the content follows the wheel inside a fixed wrapper, under a header that stays on top', async ({ page }) => {
    await page.goto('/en/');
    await expect(page.locator('html')).toHaveClass(/\bsmooth\b/);
    await expect(page.locator('app-site-header')).toHaveCSS('position', 'fixed');
    // ScrollSmoother is in charge: the page scrolls natively, the content inside a fixed wrapper follows it with a
    // transform. How far it lags depends on the frame rate (a busy CI machine ends the glide in a frame or two), so the
    // test checks who moves the content, not how slowly.
    await expect(page.locator('#smooth-wrapper')).toHaveCSS('position', 'fixed');
    await page.mouse.move(640, 400);
    await page.mouse.wheel(0, 900);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(300);
    await expect.poll(async () => Math.abs((await contentY(page)) + (await page.evaluate(() => window.scrollY))), { timeout: REST_MS }).toBeLessThan(2);
  });

  test('a link to a section lands it right under the header', async ({ page }) => {
    await page.goto('/en/');
    await page.locator('.hero a[href$="#work"]').click();
    const header = await page.locator('app-site-header').evaluate((h) => h.getBoundingClientRect().height);
    await expect.poll(() => page.locator('#work').evaluate((s) => Math.round(s.getBoundingClientRect().top)), { timeout: REST_MS }).toBeLessThanOrEqual(Math.ceil(header) + 2);
    await expect.poll(() => page.locator('#work').evaluate((s) => Math.round(s.getBoundingClientRect().top))).toBeGreaterThanOrEqual(Math.floor(header) - 2);
  });

  test('the moai stays in view while the About text scrolls, as sticky did', async ({ page }) => {
    await page.goto('/en/');
    const moai = page.locator('.about-moai');
    const atRest = async () => Math.abs((await contentY(page)) + (await page.evaluate(() => window.scrollY))) < 2;
    await page.locator('#about').evaluate((s) => { window.scrollTo(0, s.getBoundingClientRect().top + window.scrollY); });
    await expect.poll(atRest, { timeout: REST_MS }).toBe(true);
    const before = await moai.evaluate((m) => m.getBoundingClientRect().top);
    await page.evaluate(() => { window.scrollBy(0, 200); });
    await expect.poll(atRest, { timeout: REST_MS }).toBe(true);
    await expect.poll(async () => Math.abs((await moai.evaluate((m) => m.getBoundingClientRect().top)) - before)).toBeLessThan(4);
  });
});

test.describe('with reduced motion', () => {
  test.use({ smoothScroll: true, reducedMotion: 'reduce' });

  test('the page keeps its native scroll', async ({ page }) => {
    await page.goto('/en/');
    await expect(page.locator('html')).not.toHaveClass(/\bsmooth\b/);
    await expect(page.locator('app-site-header')).toHaveCSS('position', 'sticky');
  });
});
