import { expect, test } from './fixtures';

// Windows High Contrast drops box-shadows and backgrounds: rules and markers must survive it (issue #431)
test.use({ forcedColors: 'active' });

test('under forced colours the header keeps its rule and the pixel decoration hides', async ({ page }) => {
  await page.goto('/en/');
  const header = page.locator('app-site-header');
  await expect(header).toHaveCSS('border-bottom-style', 'solid');
  await expect(page.locator('app-pixel-field').first()).toHaveCSS('visibility', 'hidden');
});

// indicators drawn with a background would be repainted as Canvas: each keeps its own system colour (issue #603)
test('under forced colours the meters, the timeline and the current markers keep their colour', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'WebKit has no forced-color-adjust property to read back');
  await page.goto('/en/');
  const adjust = (selector: string, pseudo?: string) =>
    page.locator(selector).first().evaluate((el, p) => getComputedStyle(el, p).forcedColorAdjust, pseudo ?? null);
  expect(await adjust('app-stack-list .meter .on')).toBe('none');
  expect(await adjust('app-experience-timeline .cells')).toBe('none');
  expect(await adjust('app-site-header nav a', '::after')).toBe('none');
  expect(await adjust('app-language-switch [aria-current]', '::before')).toBe('none');
});

test('under forced colours the 404 battle cursor keeps its colour', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'WebKit has no forced-color-adjust property to read back');
  await page.goto('/en/404');
  const cursor = await page.locator('.move').first().evaluate((el) => getComputedStyle(el, '::before').forcedColorAdjust);
  expect(cursor).toBe('none');
});
