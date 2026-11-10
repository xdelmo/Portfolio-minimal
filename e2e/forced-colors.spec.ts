import { expect, test } from './fixtures';

// Windows High Contrast drops box-shadows and backgrounds: rules and markers must survive it (issue #431)
test.use({ forcedColors: 'active' });

test('under forced colours the header keeps its rule and the pixel decoration hides', async ({ page }) => {
  await page.goto('/en/');
  const header = page.locator('app-site-header');
  await expect(header).toHaveCSS('border-bottom-style', 'solid');
  await expect(page.locator('app-pixel-field').first()).toHaveCSS('visibility', 'hidden');
});
