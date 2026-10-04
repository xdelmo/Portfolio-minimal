import { expect, test } from './fixtures';

const WIDTHS = [320, 375, 768, 1024, 1440, 1920];

for (const width of WIDTHS) {
  test(`no horizontal scroll at ${String(width)}px`, async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'widths are checked once, in Chromium');
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/en/', '/it/', '/en/work/apexflow', '/it/work/telegram-bots', '/it/work/mcp-server']) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${path} at ${String(width)}px`).toBeLessThanOrEqual(0);
    }
  });
}

for (const path of ['/en/', '/en/work/apexflow']) {
  test(`keyboard users can skip to the content on ${path}`, async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Safari does not Tab to links by default');
    await page.goto(path);
    const heading = await page.locator('h1').textContent();
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to content' });
    await expect(skip).toBeFocused();
    await skip.press('Enter');
    await expect(page.locator('main')).toBeFocused();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.locator('h1')).toHaveText(heading ?? '');
  });
}

test('the header stays at the top while the page scrolls', async ({ page }) => {
  await page.goto('/en/');
  await page.evaluate(() => {
    window.scrollTo(0, document.documentElement.scrollHeight / 2);
  });
  const header = page.locator('app-site-header header');
  await expect(header).toBeInViewport();
  expect((await header.boundingBox())?.y).toBe(0);
  // an anchor lands below the header, not under it
  await page.goto('/en/#experience');
  const [headerBottom, titleTop] = await page.evaluate(() => [
    document.querySelector('app-site-header header')?.getBoundingClientRect().bottom ?? 0,
    document.querySelector('#experience h2')?.getBoundingClientRect().top ?? 0,
  ]);
  expect(titleTop).toBeGreaterThanOrEqual(headerBottom);
});

test.describe('contact and footer', () => {
  for (const [lang, alt] of [['en', 'Emanuele Del Monte'], ['it', 'Emanuele Del Monte']]) {
    test(`${lang}: the contact section shows Emanuele's photo and no CV line`, async ({ page }) => {
      await page.goto(`/${lang}/`);
      const photo = page.locator('#contact img');
      await photo.scrollIntoViewIfNeeded();
      await expect(photo).toHaveAttribute('alt', alt);
      await expect.poll(() => photo.evaluate((img) => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
      await expect(page.locator('#contact')).not.toContainText('CV');
    });
  }

  test("the contact photo is cut into a stepped pixel circle", async ({ page }) => {
    await page.goto('/en/');
    const photo = page.locator('#contact img');
    await photo.scrollIntoViewIfNeeded();
    const mask = await photo.evaluate((img) => getComputedStyle(img).maskImage || getComputedStyle(img).getPropertyValue('-webkit-mask-image'));
    expect(mask).toContain('svg');
  });

  test('the footer continues the dark contact band, with no gap between them', async ({ page }) => {
    await page.goto('/en/');
    await page.evaluate(() => { window.scrollTo(0, document.body.scrollHeight); });
    const box = (sel: string) =>
      page.locator(sel).evaluate((el) => {
        const r = el.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, bg: getComputedStyle(el, '::before').backgroundColor };
      });
    const contact = await box('#contact');
    const footer = await box('app-site-footer footer');
    expect(footer.bg).toBe(contact.bg);
    expect(Math.abs(footer.top - contact.bottom)).toBeLessThan(1);
  });
});
