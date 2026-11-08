import { expect, test } from './fixtures';

// Hierarchy comes from size and the wdth axis at weight 600, no extra weights (DESIGN.md, issue #307).
test('the intro sets the name in the same type as the hero', async ({ page }) => {
  await page.goto('/en/');
  const type = (selector: string) =>
    page.locator(selector).evaluate((el) => {
      const { fontSize, fontWeight, fontVariationSettings, letterSpacing } = getComputedStyle(el);
      return { fontSize, fontWeight, fontVariationSettings, letterSpacing };
    });
  expect(await type('.site-intro .name')).toEqual(await type('h1'));
});

test('strong text uses the emphasis weight of the system', async ({ page }) => {
  await page.goto('/en/blog/server-side-tables');
  await expect(page.locator('main strong').first()).toHaveCSS('font-weight', '600');
});
