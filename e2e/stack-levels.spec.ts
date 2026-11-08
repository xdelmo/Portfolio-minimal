import { expect, test, type Page } from './fixtures';

const ready = (page: Page) => expect(page.locator('app-home [data-motion]')).toHaveAttribute('data-motion', 'ready');
const toMiddle = (page: Page) =>
  page.locator('#stack .levels').evaluate((el) => {
    window.scrollTo(0, el.getBoundingClientRect().top + scrollY + el.offsetHeight / 2 - innerHeight / 2);
  });
const shifts = (page: Page) => page.locator('#stack .level ul').evaluateAll((els) => els.map((el) => Math.round(new DOMMatrix(getComputedStyle(el).transform).m41)));

test.describe('tools by level', () => {
  test('three levels: every day, in production, in side projects', async ({ page }) => {
    await page.goto('/en/');
    await expect(page.locator('#stack .level h3')).toHaveText(['Every day', 'In production', 'In side projects']);
    await expect(page.locator('#stack .level').first().getByText('Angular', { exact: true })).toBeVisible();
  });

  for (const [lang, lede] of [
    ['en', 'Three levels: what I use every day, what runs in production, what I try in my side projects.'],
    ['it', 'Tre livelli: quello che uso ogni giorno, quello che è in produzione, quello che provo nei progetti personali.'],
  ] as const) {
    test(`${lang}: the lede is true on every screen`, async ({ page }) => {
      await page.goto(`/${lang}/`);
      await expect(page.locator('#stack p.muted')).toHaveText(lede);
    });
  }

  // issue #365: the type size is the level, on every screen; from md the names sit in a column left of the tools
  for (const width of [320, 390, 768, 1024, 1440]) {
    test(`at ${String(width)}px the levels step down in size, inside the screen`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/it/');
      const levels = await page.locator('#stack .level').evaluateAll((els) =>
        els.map((el) => {
          const name = el.querySelector('h3')?.getBoundingClientRect();
          const list = el.querySelector('ul');
          const tools = list?.getBoundingClientRect();
          return { size: parseFloat(getComputedStyle(list ?? el).fontSize), nameRight: name?.right ?? 0, nameBottom: name?.bottom ?? 0, toolsLeft: tools?.left ?? 0, toolsTop: tools?.top ?? 0, right: el.getBoundingClientRect().right };
        }),
      );
      for (let i = 1; i < levels.length; i++) expect(levels[i].size).toBeLessThan(levels[i - 1].size);
      for (const level of levels) {
        if (width >= 768) expect(level.toolsLeft).toBeGreaterThan(level.nameRight);
        else expect(level.toolsTop).toBeGreaterThanOrEqual(level.nameBottom);
        expect(level.right).toBeLessThanOrEqual(width);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });
  }

  test('the tools slide in from the right and settle as the section comes up', async ({ page }) => {
    await page.goto('/en/');
    await ready(page);
    const start = await shifts(page);
    expect(start.at(-1)).toBeGreaterThan(start[0] ?? 0);
    await expect.poll(async () => { await toMiddle(page); return shifts(page); }, { timeout: 8000 }).toEqual([0, 0, 0]);
  });

  // issue #109: an effect that changes across 1024px must not leave the other version's transform behind
  test('after a resize to a phone width and back, the tools come to rest', async ({ page, isMobile }) => {
    test.skip(isMobile, 'a desktop window being resized');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/en/');
    await ready(page);
    for (const width of [900, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await toMiddle(page);
      await page.waitForTimeout(300);
    }
    await expect.poll(async () => { await toMiddle(page); return shifts(page); }, { timeout: 8000 }).toEqual([0, 0, 0]);
  });

  test.describe('with reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });
    test('the levels are at rest', async ({ page }) => {
      await page.goto('/en/');
      const transforms = await page.locator('#stack .level ul').evaluateAll((els) => els.map((el) => getComputedStyle(el).transform));
      expect(transforms.every((t) => t === 'none')).toBe(true);
    });
  });
});
