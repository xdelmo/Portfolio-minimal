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
  // Firefox lands the anchor on fractional pixels (95.85 under a 96px header): allow less than one pixel
  expect(titleTop).toBeGreaterThanOrEqual(headerBottom - 1);
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

// the header signs the site: the edm. mark, a rule, then the full name on two lines
for (const width of [1280, 390]) {
  test(`the header shows the full name beside the mark, on two lines, at ${String(width)}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/en/');
    const name = page.locator('app-site-header .logo .name');
    await expect(name).toBeVisible();
    await expect(name).toHaveText(/Emanuele\s*Del Monte/);
    const lines = await name.locator('span').evaluateAll((spans) => spans.map((s) => Math.round(s.getBoundingClientRect().top)));
    expect(lines).toHaveLength(2);
    expect(lines[1]).toBeGreaterThan(lines[0]);
    // the header row still fits: nothing pushed off the right edge
    const right = await page.locator('app-site-header .controls').evaluate((el) => el.getBoundingClientRect().right);
    expect(right).toBeLessThanOrEqual(width);
  });
}

test('on the narrowest phones the header keeps the mark alone, and still fits', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/en/');
  await expect(page.locator('app-site-header .logo .name')).toBeHidden();
  const right = await page.locator('app-site-header .controls').evaluate((el) => el.getBoundingClientRect().right);
  expect(right).toBeLessThanOrEqual(320);
});

test('back to top sits in the middle of the footer, with an arrow pointing up', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/en/');
  const footer = await page.locator('app-site-footer footer').boundingBox();
  const top = page.getByRole('link', { name: 'Back to top' });
  const box = await top.boundingBox();
  if (!footer || !box) throw new Error('missing boxes');
  expect(Math.abs(box.x + box.width / 2 - (footer.x + footer.width / 2))).toBeLessThanOrEqual(8);
  await expect(top.locator('svg')).toBeVisible();
});

// one frame per project, the same 3:2 window for a desktop screenshot, a phone screenshot or, without either,
// the project's pixel item: the list keeps one rhythm and no column is left empty
for (const width of [1280, 390]) {
  test(`every project sits in a frame of the same shape at ${String(width)}px, with a picture or a pixel item`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/en/');
    const frames = page.locator('#work .project .media');
    const count = await frames.count();
    expect(count).toBe(await page.locator('#work .project').count());
    // the layout box: the reveal may still be scaling a frame
    const boxes = await frames.evaluateAll((els) => els.map((el) => ({ w: (el as HTMLElement).offsetWidth, h: (el as HTMLElement).offsetHeight })));
    for (const box of boxes) {
      expect(Math.abs(box.w / box.h - 3 / 2)).toBeLessThan(0.02);
      expect(Math.abs(box.h - boxes[0].h)).toBeLessThanOrEqual(1);
    }
    for (let i = 0; i < count; i++) {
      expect(await frames.nth(i).locator('img.shot, app-quest-sprite').count(), `project ${String(i)}`).toBe(1);
    }
  });
}

test('the first thing each project offers is its case study', async ({ page }) => {
  await page.goto('/en/');
  const projects = page.locator('#work .project');
  for (let i = 0; i < (await projects.count()); i++) {
    await expect(projects.nth(i).getByRole('link', { name: 'Read the case study' })).toHaveAttribute('href', /\/work\/[\w-]+$/);
  }
});

// at 1024px a third of the column left the words two or three to a line beside the sprite
test('the study tiles keep their words readable at 1024px', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 800 });
  await page.goto('/en/');
  const widths = await page.locator('#experience li .text').evaluateAll((els) => els.map((el) => (el as HTMLElement).offsetWidth));
  expect(widths.length).toBeGreaterThan(0);
  for (const w of widths) expect(w).toBeGreaterThanOrEqual(200);
});

test('below the About text on a tablet, the moai stands in the middle', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('/en/');
  const centre = await page.locator('app-moai-figure').evaluate((el) => {
    const b = el.getBoundingClientRect();
    const p = (el.parentElement ?? el).getBoundingClientRect();
    return { el: b.left + b.width / 2, parent: p.left + p.width / 2 };
  });
  expect(Math.abs(centre.el - centre.parent)).toBeLessThanOrEqual(2);
});

// A project's actions sit on one row on wide screens and stack on phones (issue #94).
test('a project keeps its case study and code buttons on one row on desktop, stacked on phones', async ({ page, isMobile }) => {
  await page.goto('/en/');
  const project = page.locator('#work .project', { hasText: 'ApexFlow' });
  const read = await project.locator('.read').boundingBox();
  const code = await project.locator('.repo-link').first().boundingBox();
  if (!read || !code) throw new Error('missing buttons');
  if (isMobile) expect(code.y).toBeGreaterThan(read.y + read.height - 1);
  else expect(Math.abs(read.y + read.height / 2 - (code.y + code.height / 2))).toBeLessThanOrEqual(2);
});
