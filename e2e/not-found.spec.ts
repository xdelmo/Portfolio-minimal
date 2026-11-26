import { expect, test } from './fixtures';

test('client-side navigation to unknown project and blog slugs renders the wild 404 in place', async ({ page }) => {
  for (const path of ['/en/work/apexflw', '/en/blog/unknown-slug']) {
    await page.goto('/en/');
    await page.evaluate((target) => {
      history.pushState({}, '', target);
      dispatchEvent(new PopStateEvent('popstate'));
    }, path);
    await expect(page.locator('h1')).toHaveText('A wild 404 appeared!');
    await expect(page.locator('.battle')).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.locator('meta[property="og:image"]')).toHaveCount(0);
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
  }
});

test('hydrating Netlify static 404 HTML on unknown project and blog slugs keeps the wild 404 without NG0500', async ({ page, request }) => {
  const res404 = await request.get('/en/404/');
  expect(res404.ok()).toBe(true);
  const html404 = await res404.text();

  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on('pageerror', (err) => {
    pageErrors.push(err.message);
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await page.route(/\/en\/(work\/apexflw|blog\/unknown-slug)\/?$/, async (route) => {
    await route.fulfill({ status: 404, contentType: 'text/html; charset=utf-8', body: html404 });
  });

  for (const path of ['/en/work/apexflw', '/en/blog/unknown-slug']) {
    await page.goto(path);
    await expect(page.locator('app-site-footer [data-press-start]')).toBeVisible();
    await expect(page.locator('h1')).toHaveText('A wild 404 appeared!');
    await expect(page.locator('.battle')).toBeVisible();
  }

  expect(pageErrors).toEqual([]);
  const unexpectedConsole = consoleErrors.filter((m) => m.includes('NG0500') || !/404|Failed to load resource/i.test(m));
  expect(unexpectedConsole).toEqual([]);
});

test('the footer stays flush with the bottom of the viewport on short pages (native scroll)', async ({ page }) => {
  for (const viewport of [
    { width: 1280, height: 1080 },
    { width: 390, height: 1200 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/en/404');
    const [footerBottom, clientHeight] = await page.evaluate(() => [
      document.querySelector('footer.site-footer')?.getBoundingClientRect().bottom ?? -1,
      document.documentElement.clientHeight,
    ]);
    expect(Math.abs(footerBottom - clientHeight)).toBeLessThanOrEqual(1.5);
  }
});

test.describe('footer and scroll height under ScrollSmoother', () => {
  test.use({ smoothScroll: true });
  test.skip(({ isMobile }) => isMobile, 'desktop only');

  test('pins footer to bottom on short pages and does not clamp tall pages', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1080 });
    await page.goto('/en/404');
    await expect(page.locator('html')).toHaveClass(/\bsmooth\b/);
    await expect(page.locator('#smooth-wrapper')).toHaveCSS('position', 'fixed');

    const [footerBottom, clientHeight] = await page.evaluate(() => [
      document.querySelector('footer.site-footer')?.getBoundingClientRect().bottom ?? -1,
      document.documentElement.clientHeight,
    ]);
    expect(Math.abs(footerBottom - clientHeight)).toBeLessThanOrEqual(1.5);

    await page.goto('/en/work/apexflow');
    const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
    expect(scrollHeight).toBeGreaterThan(1500);
    await page.mouse.move(640, 400);
    await page.mouse.wheel(0, 600);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(200);
  });
});
