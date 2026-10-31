import { REST_MS, expect, test, type Page } from './fixtures';

// issue #159: smooth scroll with GSAP ScrollSmoother, on desktop with a mouse only

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

  // issue #270: pinned through the smoother, moved by its transform
  test('past the About the moai rests in the bottom-right corner, 16px from the edges', async ({ page }) => {
    await page.goto('/en/');
    await page.locator('#experience').evaluate((s) => { window.scrollTo(0, s.getBoundingClientRect().top + window.scrollY + 400); });
    const top = await settledTop(page, 'app-moai-figure .body');
    const bottom = await page.locator('app-moai-figure .body').evaluate((el) => document.documentElement.clientHeight - el.getBoundingClientRect().bottom);
    expect(Math.abs(bottom - 16)).toBeLessThan(2);
    await page.evaluate(() => { window.scrollBy(0, 600); });
    expect(Math.abs((await settledTop(page, 'app-moai-figure .body')) - top)).toBeLessThan(2);
  });
});

test.describe('parallax under smooth scroll (issue #160)', () => {
  test.use({ smoothScroll: true });
  test.skip(({ isMobile }) => isMobile, 'touch keeps the native scroll');

  const lift = (page: Page) =>
    page.locator('#work .media').first().evaluate((m) => new DOMMatrix(getComputedStyle(m).transform).m42);

  test('a project picture scrolls slower than its text, and sits in place when centred', async ({ page }) => {
    await page.goto('/en/');
    const media = page.locator('#work .media').first();
    // Every read waits for the page to settle, and each scroll is aimed again until its check holds: the content at
    // rest for one read could still be nudged by a ScrollTrigger refresh, and an aim taken before it left the picture
    // 87 px off centre in WebKit on CI (issue #222).
    // the picture near the top of the screen: moved off its place
    await expect(async () => {
      await media.evaluate((m) => { window.scrollTo(0, m.getBoundingClientRect().top + window.scrollY - 40); });
      await settledTop(page, '#work .media >> nth=0');
      // speed 0.9: off its place by a tenth of how far its centre is from the screen's (as laid out, before the lift)
      const expected = await media.evaluate((m) => {
        const box = m.getBoundingClientRect();
        const y = new DOMMatrix(getComputedStyle(m).transform).m42;
        return 0.1 * Math.abs(innerHeight / 2 - (box.top - y + box.height / 2));
      });
      expect(expected).toBeGreaterThan(3);
      expect(Math.abs(Math.abs(await lift(page)) - expected)).toBeLessThan(2);
    }).toPass({ timeout: 2 * REST_MS });
    // centred in the screen: where the layout puts it, so the aim leaves out the lift
    await expect(async () => {
      await media.evaluate((m) => {
        const top = m.getBoundingClientRect().top - new DOMMatrix(getComputedStyle(m).transform).m42;
        window.scrollTo(0, top + window.scrollY - (innerHeight - m.offsetHeight) / 2);
      });
      await settledTop(page, '#work .media >> nth=0');
      expect(Math.abs(await lift(page))).toBeLessThan(3);
    }).toPass({ timeout: 2 * REST_MS });
  });
});

test('without smooth scroll the pictures do not move', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop layout');
  await page.goto('/en/');
  const media = page.locator('#work .media').first();
  await media.evaluate((m) => { window.scrollTo(0, m.getBoundingClientRect().top + window.scrollY - 40); });
  await page.waitForTimeout(300);
  expect(await media.evaluate((m) => new DOMMatrix(getComputedStyle(m).transform).m42)).toBe(0);
});

test.describe('with reduced motion', () => {
  test.use({ smoothScroll: true, reducedMotion: 'reduce' });

  test('the page keeps its native scroll', async ({ page }) => {
    await page.goto('/en/');
    await expect(page.locator('html')).not.toHaveClass(/\bsmooth\b/);
    await expect(page.locator('app-site-header')).toHaveCSS('position', 'sticky');
  });
});
