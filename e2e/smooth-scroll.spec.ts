import { expect, test, type Page } from './fixtures';

// issue #159: smooth scroll with GSAP ScrollSmoother, on desktop with a mouse only
// GSAP's lag smoothing advances its clock by at most ~33 ms a frame: on a busy machine (200 ms frames) the one-second
// glide takes about six, so waiting for the content to rest allows 15 s
const REST_MS = 15_000;

const contentY = (page: Page) =>
  page.evaluate(() => new DOMMatrix(getComputedStyle(document.getElementById('smooth-content') ?? document.body).transform).m42);

/**
 * The top of `selector` once the page has settled: the content at rest and the element in the same place in two reads
 * 300 ms apart. A ScrollTrigger refresh (the moai's canvas arriving) nudges the content again after it first comes to
 * rest, and a position read in between was 110 px off in WebKit.
 */
async function settledTop(page: Page, selector: string): Promise<number> {
  let last = Number.NaN;
  let top = Number.NaN;
  await expect
    .poll(
      async () => {
        const [y, m] = await Promise.all([page.evaluate(() => window.scrollY), contentY(page)]);
        top = await page.locator(selector).evaluate((el) => el.getBoundingClientRect().top);
        const still = Math.abs(y + m) < 2 && Math.abs(top - last) < 1;
        last = top;
        return still;
      },
      { timeout: REST_MS, intervals: [300] },
    )
    .toBe(true);
  return top;
}

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
    // the header's link: fixed, so Playwright never scrolls to reach it. The hero's button sits across the fold of a
    // 1280 × 720 window: Playwright scrolled to it, the content was still gliding there, and on a busy machine the click
    // landed where the button had been (pre-push run, 448 px instead of under the header)
    await page.locator('.site-header > nav a[href$="#work"]').click();
    const header = await page.locator('app-site-header').evaluate((h) => h.getBoundingClientRect().height);
    await expect.poll(() => page.locator('#work').evaluate((s) => Math.round(s.getBoundingClientRect().top)), { timeout: REST_MS }).toBeLessThanOrEqual(Math.ceil(header) + 2);
    await expect.poll(() => page.locator('#work').evaluate((s) => Math.round(s.getBoundingClientRect().top))).toBeGreaterThanOrEqual(Math.floor(header) - 2);
  });

  test('the moai stays in view while the About text scrolls, as sticky did', async ({ page }) => {
    await page.goto('/en/');
    await page.locator('#about').evaluate((s) => { window.scrollTo(0, s.getBoundingClientRect().top + window.scrollY); });
    const before = await settledTop(page, '.about-moai');
    await page.evaluate(() => { window.scrollBy(0, 200); });
    expect(Math.abs((await settledTop(page, '.about-moai')) - before)).toBeLessThan(4);
  });

  test('the moai keeps sticking when the About section grows after the page has loaded', async ({ page }) => {
    await page.goto('/en/');
    // 300 px more text: the pin measured its end on the shorter section (the WebKit failure of a pre-push run)
    await page.locator('#about .about-text').evaluate((t) => { t.insertAdjacentHTML('beforeend', '<div style="height: 300px"></div>'); });
    await page.locator('#about').evaluate((s) => { window.scrollTo(0, s.getBoundingClientRect().top + window.scrollY); });
    const before = await settledTop(page, '.about-moai');
    // past where the shorter section ended its pin
    await page.evaluate(() => { window.scrollBy(0, 450); });
    expect(Math.abs((await settledTop(page, '.about-moai')) - before)).toBeLessThan(4);
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
