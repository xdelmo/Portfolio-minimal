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

  test('the moai stays in view while the About text scrolls, as sticky did', async ({ page }) => {
    await page.goto('/en/');
    await page.locator('#about').evaluate((s) => { window.scrollTo(0, s.getBoundingClientRect().top + window.scrollY); });
    const before = await settledTop(page, '.about-moai');
    await page.evaluate(() => { window.scrollBy(0, 200); });
    expect(Math.abs((await settledTop(page, '.about-moai')) - before)).toBeLessThan(4);
  });

  test('the moai sticks at its own top under the header, and stops at the end of the About section (issue #169)', async ({ page }) => {
    await page.goto('/en/');
    const stickyTop = await page.evaluate(() => {
      const probe = document.createElement('div');
      probe.style.height = 'calc(var(--header-h) + var(--space-8))';
      document.body.append(probe);
      const h = probe.offsetHeight;
      probe.remove();
      return h;
    });
    await page.locator('#about').evaluate((s) => { window.scrollTo(0, s.getBoundingClientRect().top + window.scrollY + 100); });
    expect(Math.abs((await settledTop(page, '.about-moai')) - stickyTop)).toBeLessThan(4);
    // well past the section: the moai has left with it, its foot never below the section's
    await page.locator('#experience').evaluate((s) => { window.scrollTo(0, s.getBoundingClientRect().top + window.scrollY); });
    await settledTop(page, '.about-moai');
    const [moaiBottom, aboutBottom] = await page.evaluate(() => [
      document.querySelector('.about-moai')?.getBoundingClientRect().bottom ?? 0,
      document.getElementById('about')?.getBoundingClientRect().bottom ?? 0,
    ]);
    expect(moaiBottom).toBeLessThanOrEqual(aboutBottom + 1);
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

test.describe('parallax under smooth scroll (issue #160)', () => {
  test.use({ smoothScroll: true });
  test.skip(({ isMobile }) => isMobile, 'touch keeps the native scroll');

  const lift = (page: Page) =>
    page.locator('#work .media').first().evaluate((m) => new DOMMatrix(getComputedStyle(m).transform).m42);

  test('a project picture scrolls slower than its text, and sits in place when centred', async ({ page }) => {
    await page.goto('/en/');
    const media = page.locator('#work .media').first();
    const atRest = async () => Math.abs((await contentY(page)) + (await page.evaluate(() => window.scrollY))) < 2;
    // the picture near the top of the screen: moved off its place
    await media.evaluate((m) => { window.scrollTo(0, m.getBoundingClientRect().top + window.scrollY - 40); });
    await expect.poll(atRest, { timeout: REST_MS }).toBe(true);
    // speed 0.9: off its place by a tenth of how far its centre is from the screen's (as laid out, before the lift)
    const expected = await media.evaluate((m) => {
      const box = m.getBoundingClientRect();
      const y = new DOMMatrix(getComputedStyle(m).transform).m42;
      return 0.1 * Math.abs(innerHeight / 2 - (box.top - y + box.height / 2));
    });
    expect(expected).toBeGreaterThan(3);
    expect(Math.abs(Math.abs(await lift(page)) - expected)).toBeLessThan(2);
    // centred in the screen: where the layout puts it
    await media.evaluate((m) => { window.scrollTo(0, m.getBoundingClientRect().top + window.scrollY - (innerHeight - m.offsetHeight) / 2); });
    await expect.poll(atRest, { timeout: REST_MS }).toBe(true);
    await expect.poll(async () => Math.abs(await lift(page)), { timeout: REST_MS }).toBeLessThan(3);
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
