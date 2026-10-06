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
    // both boxes in one go: the lazy motion chunk may add the experience pin spacer between two separate reads
    const [contact, footer] = await page.evaluate(() =>
      ['#contact', 'app-site-footer footer'].map((sel) => {
        const el = document.querySelector(sel);
        if (!el) throw new Error(`missing ${sel}`);
        const r = el.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, bg: getComputedStyle(el, '::before').backgroundColor };
      }),
    );
    expect(footer.bg).toBe(contact.bg);
    expect(Math.abs(footer.top - contact.bottom)).toBeLessThan(1);
  });
});

test.describe('hero and work on phones', () => {
  test('the field sits behind the title on phones and on desktop', async ({ page }) => {
    await page.goto('/en/');
    const field = await page.locator('.hero app-pixel-field').boundingBox();
    const title = await page.locator('.hero h1').boundingBox();
    if (!field || !title) throw new Error('missing hero boxes');
    expect(field.x).toBeLessThanOrEqual(title.x);
    expect(field.y).toBeLessThanOrEqual(title.y);
    expect(field.y + field.height).toBeGreaterThanOrEqual(title.y + title.height);
  });

  test('on phones each project shows its image before its text', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'phones only');
    await page.goto('/en/');
    const first = page.locator('#work .project').first();
    const media = await first.locator('.media').boundingBox();
    const text = await first.locator('.text').boundingBox();
    if (!media || !text) throw new Error('missing project boxes');
    expect(media.y).toBeLessThan(text.y);
  });

  test('a phone screenshot downloads the half-width copy on a phone', async ({ browser, browserName }) => {
    test.skip(browserName !== 'chromium', 'image choice is checked once, in Chromium');
    // a 1x phone: the tall picture is shown at most 280px wide, so the 300px copy is enough
    const context = await browser.newContext({ viewport: { width: 412, height: 900 }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    await page.goto('/en/');
    const shot = page.locator('#work .project--tall .shot');
    await shot.scrollIntoViewIfNeeded();
    await expect.poll(() => shot.evaluate((img: HTMLImageElement) => img.currentSrc)).toMatch(/ice-friends-breaker-300\.jpg$/);
    await context.close();
  });

  test('project pictures below the hero leave the bandwidth to the hero', async ({ page }) => {
    // the hero fills the first screen, so no project picture is preloaded or fetched eagerly
    await page.goto('/en/');
    await expect(page.locator('link[rel="preload"][as="image"]')).toHaveCount(0);
    // nor do the app's chunks in the head: the page is prerendered, so the font comes before Angular (angular.json
    // preloadInitial); @angular/ssr still lists the route's lazy chunks at the end of the body, for hydration
    await expect(page.locator('head link[rel="modulepreload"]')).toHaveCount(0);
    for (const shot of await page.locator('#work .shot').all()) {
      await expect(shot).toHaveAttribute('loading', 'lazy');
    }
  });
});

test('small text never drops under 14px, and section titles stay well below the headline', async ({ page }) => {
  await page.goto('/en/');
  const size = (selector: string) => page.locator(selector).first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  for (const selector of ['#work .stack li', '#side-quests .tags', 'app-site-footer p']) {
    expect(await size(selector), selector).toBeGreaterThanOrEqual(14);
  }
  expect(await size('#work h2')).toBeLessThanOrEqual((await size('h1')) * 0.75);
});

// one vertical rhythm: 64px from a section's edge to its title, and 64px from its last line to whatever comes next,
// a band's pixel seam included (the seam sits above the band, inside the section before it)
for (const width of [1280, 390]) {
  test(`every home section keeps the same space above its title and below its content at ${String(width)}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/en/');
    // measure with the experience pin in place, at rest at the top (a jump to the bottom and back left WebKit
    // measuring the deck where the pin had parked it)
    await expect(page.locator('app-home [data-motion]')).toHaveAttribute('data-motion', 'ready');
    const gaps = await page.evaluate(() => {
      const top = (el: Element) => el.getBoundingClientRect().top + scrollY;
      const sections = [...document.querySelectorAll<HTMLElement>('main section[id]')];
      return sections.slice(0, -1).map((section, i) => {
        const parts = [...section.querySelectorAll<HTMLElement>('*')].filter(
          (el) => !el.closest('app-pixel-dissolve') && el.getBoundingClientRect().height > 0 && getComputedStyle(el).position !== 'absolute',
        );
        const bottom = Math.max(...parts.map((el) => el.getBoundingClientRect().bottom + scrollY));
        const title = section.querySelector('h2');
        const next = sections[i + 1];
        const seam = next.querySelector(':scope > app-pixel-dissolve');
        return { id: section.id, above: Math.round((title ? top(title) : 0) - top(section)), below: Math.round((seam ? top(seam) : top(next)) - bottom) };
      });
    });
    for (const gap of gaps) {
      expect(gap.above, `${gap.id}: space above the title`).toBeGreaterThanOrEqual(56);
      expect(gap.above, `${gap.id}: space above the title`).toBeLessThanOrEqual(72);
      expect(gap.below, `${gap.id}: space below the content`).toBeGreaterThanOrEqual(48);
    }
  });
}
