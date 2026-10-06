import { expect, test, type Page } from './fixtures';

const ready = (page: Page) => expect(page.locator('app-home [data-motion]')).toHaveAttribute('data-motion', 'ready');
const toMiddle = (page: Page) =>
  page.locator('#stack .levels').evaluate((el) => {
    window.scrollTo(0, el.getBoundingClientRect().top + scrollY + el.offsetHeight / 2 - innerHeight / 2);
  });

interface Box { x: number; y: number; w: number; h: number }
const overlap = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

test.describe('tools by level', () => {
  test('three levels: every day, in production, in side projects', async ({ page }) => {
    await page.goto('/en/');
    await expect(page.locator('#stack .level h3')).toHaveText(['Every day', 'In production', 'In side projects']);
    await expect(page.locator('#stack .level').first().getByText('Angular', { exact: true })).toBeVisible();
  });

  // the rings are a desktop layout: phones show stepped rows, so the lede must not speak of a middle or of circles
  for (const [lang, lede] of [
    ['en', 'Three levels: what I use every day, what runs in production, what I try in my side projects.'],
    ['it', 'Tre livelli: quello che uso ogni giorno, quello che è in produzione, quello che provo nei progetti personali.'],
  ] as const) {
    test(`${lang}: the lede is true on every screen`, async ({ page }) => {
      await page.goto(`/${lang}/`);
      await expect(page.locator('#stack p.muted')).toHaveText(lede);
    });
  }

  for (const lang of ['en', 'it']) {
    for (const [width, height] of [[1024, 900], [1440, 720]]) {
      test(`${lang} at ${String(width)}×${String(height)}: the tools sit on concentric rings, none overlapping`, async ({ page, isMobile }) => {
        test.skip(isMobile, 'the rings are a desktop layout');
        await page.setViewportSize({ width, height });
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto(`/${lang}/`);
        await toMiddle(page);
        const layout = await page.locator('#stack .levels').evaluate((root) => {
          const box = (el: Element) => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; };
          const c = box(root);
          const cx = c.x + c.w / 2;
          const cy = c.y + c.h / 2;
          return [...root.querySelectorAll('.level')].map((level) => ({
            radius: box(level).w / 2,
            distances: [...level.querySelectorAll('li')].map((li) => { const b = box(li); return Math.hypot(b.x + b.w / 2 - cx, b.y + b.h / 2 - cy); }),
            boxes: [...level.querySelectorAll('li, h3')].map(box),
          }));
        });
        expect(layout).toHaveLength(3);
        // the whole diagram fits in the screen under the header, so the outer ring's name is never hidden
        const fits = await page.locator('#stack .levels').evaluate((el) => el.getBoundingClientRect().height <= innerHeight - parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')));
        expect(fits).toBe(true);
        for (let i = 0; i < layout.length; i++) {
          if (i > 0) expect(layout[i].radius).toBeGreaterThan(layout[i - 1].radius);
          for (const d of layout[i].distances) expect(Math.abs(d - layout[i].radius)).toBeLessThanOrEqual(12);
        }
        const all = layout.flatMap((l) => l.boxes);
        for (let a = 0; a < all.length; a++) for (let b = a + 1; b < all.length; b++) expect(overlap(all[a], all[b]), `tags ${String(a)} and ${String(b)}`).toBe(false);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      });
    }
  }

  for (const width of [320, 390, 768]) {
    test(`at ${String(width)}px the levels are rows that step right, inside the screen`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/it/');
      const rows = await page.locator('#stack .level').evaluateAll((els) => els.map((el) => { const r = el.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom }; }));
      for (let i = 1; i < rows.length; i++) {
        expect(rows[i].left).toBeGreaterThan(rows[i - 1].left);
        // a clear gap between levels, so each one reads as a step
        expect(rows[i].top - rows[i - 1].bottom).toBeGreaterThanOrEqual(32);
      }
      for (const row of rows) expect(row.right).toBeLessThanOrEqual(width);
    });
  }

  test('on desktop the rings turn in and settle as the section reaches the middle of the screen', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/en/');
    await ready(page);
    const turn = () => page.locator('#stack .level').last().evaluate((el) => { const m = new DOMMatrix(getComputedStyle(el).transform); return Math.round((Math.atan2(m.b, m.a) * 180) / Math.PI); });
    expect(Math.abs(await turn())).toBeGreaterThan(5);
    await expect.poll(async () => { await toMiddle(page); return turn(); }, { timeout: 8000 }).toBe(0);
  });

  test('on phones the rows step in and settle', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'phones');
    await page.goto('/en/');
    await ready(page);
    const shift = () => page.locator('#stack .level').last().evaluate((el) => Math.round(new DOMMatrix(getComputedStyle(el).transform).m41));
    expect(Math.abs(await shift())).toBeGreaterThan(4);
    await expect.poll(async () => { await toMiddle(page); return shift(); }, { timeout: 8000 }).toBe(0);
  });

  test.describe('with reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });
    test('the levels are at rest', async ({ page }) => {
      await page.goto('/en/');
      const transforms = await page.locator('#stack .level').evaluateAll((els) => els.map((el) => getComputedStyle(el).transform));
      expect(transforms.every((t) => t === 'none')).toBe(true);
    });
  });
});
