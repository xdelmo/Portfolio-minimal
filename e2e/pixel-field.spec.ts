import { expect, test, type Page } from './fixtures';
import { press } from './site';
import { DRAWS_MS, countFieldDraws, fieldDraws } from './field-draws';

const canvas = (page: Page) => page.locator('app-pixel-field canvas');
const snapshot = (page: Page) => canvas(page).evaluate((c) => (c as HTMLCanvasElement).toDataURL());
const isPainted = (page: Page) =>
  canvas(page).evaluate((c) => {
    const el = c as HTMLCanvasElement;
    const blank = document.createElement('canvas');
    blank.width = el.width;
    blank.height = el.height;
    return el.toDataURL() !== blank.toDataURL();
  });

test('draws the field and keeps it moving', async ({ page }) => {
  await countFieldDraws(page);
  await page.goto('/en/');
  // on short phones the field starts below the fold, where it rightly stops drawing
  await canvas(page).scrollIntoViewIfNeeded();
  await expect(canvas(page)).toBeVisible();
  await expect.poll(() => isPainted(page)).toBe(true);
  // its loop keeps drawing, counted in frames (issue #53: WebKit in CI draws about 4 a second)
  const before = await fieldDraws(page);
  await expect.poll(() => fieldDraws(page), { timeout: DRAWS_MS }).toBeGreaterThan(before + 2);
});

// issue #207: in canvas 2D the field was some 9000 fillRects a frame, and the page dropped frames while it scrolled
test('draws with WebGL wherever the browser offers it, every dot in one call', async ({ page }) => {
  await page.goto('/en/');
  await expect.poll(() => isPainted(page)).toBe(true);
  // Firefox without a GPU (CI) offers no WebGL: there the canvas 2D field draws, as it should
  const offered = await page.evaluate(() => document.createElement('canvas').getContext('webgl') !== null);
  // a canvas has one kind of context: a WebGL one answers no 2D context
  expect(await canvas(page).evaluate((c) => (c as HTMLCanvasElement).getContext('2d') === null)).toBe(offered);
});

test('repaints with the new colours when the theme changes while paused', async ({ page }) => {
  await page.goto('/en/');
  await press(page, 'Pause animations');
  const before = await snapshot(page);
  await press(page, /Switch to (light|dark) theme/);
  await expect.poll(() => snapshot(page)).not.toBe(before);
});

test('stops drawing when scrolled out of view', async ({ page }) => {
  await page.goto('/en/');
  await expect.poll(() => isPainted(page)).toBe(true);
  await page.locator('footer').scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  const away = await snapshot(page);
  await page.waitForTimeout(300);
  expect(await snapshot(page)).toBe(away);
});

test('stays sharp after the window is resized', async ({ page }) => {
  await page.goto('/en/');
  await page.setViewportSize({ width: 375, height: 800 });
  await expect
    .poll(() =>
      canvas(page).evaluate((c) => {
        const el = c as HTMLCanvasElement;
        return el.width - Math.round(el.clientWidth * Math.min(window.devicePixelRatio, 2));
      }),
    )
    .toBe(0);
});

test('never blocks scrolling or pinch-zoom on touch screens', async ({ page }) => {
  await page.goto('/en/');
  // Chromium reports the default as an empty string, the others as "auto"
  expect(['', 'auto']).toContain(await canvas(page).evaluate((c) => getComputedStyle(c).touchAction));
});

for (const [width, height] of [
  [1024, 768],
  [1280, 800],
  [1440, 900],
] as const) {
  test(`keeps the hero buttons in the first screen at ${String(width)}×${String(height)}`, async ({ page, isMobile }) => {
    test.skip(isMobile, 'laptop sizes');
    await page.setViewportSize({ width, height });
    await page.goto('/en/');
    await expect(page.getByRole('link', { name: 'See my work' })).toBeInViewport({ ratio: 1 });
  });
}

test('does not shift the layout while it starts', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'layout-shift entries exist only in Chromium');
  await page.goto('/en/');
  await expect.poll(() => isPainted(page)).toBe(true);
  const shift = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        let total = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) total += (entry as PerformanceEntry & { value: number }).value;
        }).observe({ type: 'layout-shift', buffered: true });
        setTimeout(() => {
          resolve(total);
        }, 200);
      }),
  );
  expect(shift).toBe(0);
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('shows a still picture and no pause button', async ({ page }) => {
    await page.goto('/it/');
    await expect.poll(() => isPainted(page)).toBe(true);
    await expect(page.getByRole('button', { name: 'Metti in pausa le animazioni' })).toHaveCount(0);
    const still = await snapshot(page);
    await page.waitForTimeout(300);
    expect(await snapshot(page)).toBe(still);
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('keeps the hero text and the space for the field', async ({ page }) => {
    await page.goto('/en/');
    await expect(page.locator('h1')).toBeVisible();
    const box = await page.locator('app-pixel-field').boundingBox();
    expect(box?.height).toBeGreaterThan(150);
  });
});

test.describe('the abstract field', () => {
  test('it spreads behind the whole hero, under the text, on phones as on desktop', async ({ page }) => {
    await page.goto('/en/');
    const field = await page.locator('.hero app-pixel-field').boundingBox();
    const title = await page.locator('.hero h1').boundingBox();
    if (!field || !title) throw new Error('missing hero boxes');
    expect(field.x).toBeLessThanOrEqual(title.x);
    expect(field.x + field.width).toBeGreaterThanOrEqual(title.x + title.width);
    expect(field.y).toBeLessThanOrEqual(title.y);
    expect(field.y + field.height).toBeGreaterThanOrEqual(title.y + title.height);
    // the text stays on top and readable
    const onTop = await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.closest('h1') !== null, [title.x + 20, title.y + title.height / 2]);
    expect(onTop).toBe(true);
  });

  test('the cloud fills the hero without a mask', async ({ page }) => {
    await page.goto('/en/');
    const field = page.locator('.hero .field');
    const mask = await field.evaluate((el) => {
      const style = getComputedStyle(el);
      return style.maskImage || style.getPropertyValue('-webkit-mask-image');
    });
    expect(mask).toBe('none');
    expect(await field.boundingBox()).toEqual(await page.locator('.hero').boundingBox());
  });

  for (const [width, height] of [[1440, 900], [390, 844]]) {
    test(`the cloud runs edge to edge without a horizontal scroll at ${String(width)}×${String(height)}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/en/');
      const field = await page.locator('.hero app-pixel-field').boundingBox();
      const view = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
      if (!field) throw new Error('missing field box');
      expect(field.x).toBeCloseTo(0, 0);
      expect(Math.abs(field.width - view.client)).toBeLessThanOrEqual(1);
      expect(view.scroll).toBeLessThanOrEqual(view.client);
    });
  }

  test('the clearing leaves the cloud room on a wide hero', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/en/');
    await expect(canvas(page)).toHaveAttribute('data-clear', /.+/);
    const clearW = Number((await canvas(page).getAttribute('data-clear'))?.split(',')[2]);
    const hero = await page.locator('.hero').boundingBox();
    if (!hero) throw new Error('missing hero box');
    expect(clearW).toBeLessThan(hero.width * 0.9);
  });

  test('the clearing follows the text block', async ({ page }) => {
    const holdsCopy = async (): Promise<void> => {
      await expect(async () => {
        const data = await canvas(page).getAttribute('data-clear');
        const [cx, cy, cw, ch] = (data ?? '').split(',').map(Number);
        const c = await canvas(page).boundingBox();
        const t = await page.locator('.hero .copy').boundingBox();
        if (!c || !t || data === null) throw new Error('missing boxes');
        expect(cx + c.x).toBeLessThanOrEqual(t.x + 1);
        expect(cy + c.y).toBeLessThanOrEqual(t.y + 1);
        expect(cx + cw + c.x).toBeGreaterThanOrEqual(t.x + t.width - 1);
        expect(cy + ch + c.y).toBeGreaterThanOrEqual(t.y + t.height - 1);
        // it hugs the text: no wider than the widest of headline, lede and buttons, plus a margin of two cells
        const widths = await page.locator('.hero .copy > *').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().width));
        expect(cw).toBeLessThanOrEqual(Math.max(...widths) + 24);
      }).toPass();
    };
    for (const [width, height] of [[1440, 900], [390, 844]]) {
      await page.setViewportSize({ width, height });
      await page.goto('/en/');
      await holdsCopy();
    }
    await page.setViewportSize({ width: 1024, height: 768 });
    await holdsCopy();
  });

  test('the cloud surrounds the text on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/en/');
    await expect(canvas(page)).toHaveAttribute('data-clear', /.+/);
    // read the pixels of the canvas copy: lit cells left, right, above and below the clearing, none inside it
    const lit = await canvas(page).evaluate((c) => {
      const el = c as HTMLCanvasElement;
      const [cx, cy, cw, ch] = (el.dataset['clear'] ?? '').split(',').map(Number);
      const k = el.width / el.clientWidth;
      const copy = document.createElement('canvas');
      copy.width = el.width;
      copy.height = el.height;
      const ctx = copy.getContext('2d');
      if (!ctx) throw new Error('no 2d context');
      ctx.drawImage(el, 0, 0);
      const count = (x: number, y: number, w: number, h: number): number => {
        const data = ctx.getImageData(Math.max(0, x * k), Math.max(0, y * k), Math.max(1, w * k), Math.max(1, h * k)).data;
        let n = 0;
        for (let i = 3; i < data.length; i += 4) if (data[i] > 0) n++;
        return n;
      };
      return {
        left: count(0, 0, cx, el.clientHeight),
        right: count(cx + cw, 0, el.clientWidth - cx - cw, el.clientHeight),
        above: count(0, 0, el.clientWidth, cy),
        below: count(0, cy + ch, el.clientWidth, el.clientHeight - cy - ch),
        inside: count(cx, cy, cw, ch),
      };
    });
    expect(lit.left).toBeGreaterThan(0);
    expect(lit.right).toBeGreaterThan(0);
    expect(lit.above).toBeGreaterThan(0);
    expect(lit.below).toBeGreaterThan(0);
    expect(lit.inside).toBe(0);
  });
});
