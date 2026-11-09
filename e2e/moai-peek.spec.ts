import { expect, test, type Page } from './fixtures';

// how far the pixel moai has risen out of its window behind the word, in px (0 = hidden below the window's edge)
const risen = (page: Page) =>
  page.locator('.lede app-moai-peek').evaluate((el) => {
    const win = el.querySelector('.window')?.getBoundingClientRect();
    const moai = el.querySelector('svg')?.getBoundingClientRect();
    return win && moai ? Math.round(win.bottom - moai.top) : -1;
  });

for (const [lang, word] of [
  ['en', 'closely'],
  ['it', 'bene'],
] as const) {
  test(`${lang}: the moai peeks out from behind "${word}" on hover and hides again`, async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop pointers only');
    await page.goto(`/${lang}/`);
    const peek = page.locator('.lede app-moai-peek');
    await expect(peek).toHaveText(word);
    expect(await risen(page)).toBe(0);

    const box = await peek.boundingBox();
    if (!box) throw new Error('no box for the word');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await expect.poll(() => risen(page)).toBe(24);

    await page.mouse.move(box.x + box.width / 2, box.y + box.height + 200);
    await expect.poll(() => risen(page)).toBe(0);
  });
}

test('the peeking moai is decoration: hidden from screen readers, the lede reads as one sentence', async ({ page }) => {
  await page.goto('/en/');
  await expect(page.locator('.lede svg')).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('.lede')).toHaveText(/for whoever looks closely\.$/);
});

test('no peeking moai on phones', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phones only');
  await page.goto('/en/');
  await expect(page.locator('.lede app-moai-peek .window')).toBeHidden();
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('the moai stays hidden', async ({ page }) => {
    await page.goto('/en/');
    await expect(page.locator('.lede app-moai-peek .window')).toBeHidden();
  });
});
