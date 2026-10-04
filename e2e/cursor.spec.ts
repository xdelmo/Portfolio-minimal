import { expect, test, type Page } from './fixtures';

const cursor = (page: Page) => page.locator('app-pixel-cursor .pixel-cursor');
const ready = (page: Page) => expect(page.locator('app-pixel-cursor')).toHaveAttribute('data-motion', 'ready');
// the lean lives in the `translate` property, apart from hover transforms
const translate = (page: Page, selector: string) =>
  page.locator(selector).first().evaluate((el) => parseFloat(getComputedStyle(el).translate.split(' ')[0]) || 0);

test.describe('on a desktop with a mouse', () => {
  test.skip(({ isMobile }) => isMobile, 'mouse only');

  test('a pixel follows the pointer, and the system cursor stays', async ({ page }) => {
    await page.goto('/en/');
    await ready(page);
    await page.mouse.move(400, 300);
    await expect(cursor(page)).toBeVisible();
    await expect
      .poll(async () => {
        const box = await cursor(page).boundingBox();
        return box ? Math.hypot(box.x + box.width / 2 - 400, box.y + box.height / 2 - 300) : 999;
      })
      .toBeLessThan(6);
    expect(await page.evaluate(() => getComputedStyle(document.body).cursor)).not.toBe('none');
  });

  test('it opens into a frame over links and buttons', async ({ page }) => {
    await page.goto('/en/');
    await ready(page);
    await page.getByRole('link', { name: 'See my work' }).hover();
    await expect(cursor(page)).toHaveClass(/is-over/);
    // an empty spot under the header, beside the headline
    await page.mouse.move(700, 130);
    await page.mouse.move(710, 140);
    await expect(cursor(page)).not.toHaveClass(/is-over/);
  });

  test('buttons lean towards the pointer and settle back when it leaves', async ({ page }) => {
    await page.goto('/en/');
    await ready(page);
    const button = page.getByRole('link', { name: 'See my work' });
    const box = await button.boundingBox();
    if (!box) throw new Error('no button');
    await button.hover({ position: { x: box.width - 4, y: box.height / 2 } });
    await expect.poll(() => translate(page, 'a.button--primary')).toBeGreaterThan(1);
    await page.getByRole('heading', { level: 1 }).hover();
    await expect.poll(() => translate(page, 'a.button--primary')).toBeCloseTo(0, 0);
  });
});

test('phones have no pixel cursor', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phones only');
  await page.goto('/en/');
  await expect(cursor(page)).toBeHidden();
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('there is no pixel cursor and nothing leans', async ({ page, isMobile }) => {
    test.skip(isMobile, 'mouse only');
    await page.goto('/en/');
    await page.mouse.move(400, 300);
    await expect(cursor(page)).toBeHidden();
  });
});
