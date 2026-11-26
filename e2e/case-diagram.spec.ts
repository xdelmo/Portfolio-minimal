import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './fixtures';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

for (const path of ['/en/work/apexflow', '/it/work/pokeverba']) {
  test(`${path}: architecture diagram defaults to built mode and switches interactively (#645)`, async ({ page }) => {
    await page.goto(path);
    const group = page.locator('app-case-diagram [role="group"]');
    const buttons = group.locator('button');
    await expect(buttons).toHaveCount(2);
    await expect(buttons.nth(0)).toHaveAttribute('aria-pressed', 'false');
    await expect(buttons.nth(1)).toHaveAttribute('aria-pressed', 'true');
    const initialCaption = await page.locator('app-case-diagram .diagram-caption').textContent();

    await buttons.nth(0).click();
    await expect(buttons.nth(0)).toHaveAttribute('aria-pressed', 'true');
    await expect(buttons.nth(1)).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('app-case-diagram .diagram-caption')).not.toHaveText(initialCaption ?? '');
    await expect(page.locator('app-case-diagram .diagram-steps li')).toHaveCount(3);
  });
}

for (const colorScheme of ['light', 'dark'] as const) {
  test(`case study architecture diagram meets WCAG 2.2 AA in ${colorScheme} theme`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto('/en/work/apexflow');
    await page.locator('app-case-diagram').scrollIntoViewIfNeeded();
    const results = await new AxeBuilder({ page }).include('app-case-diagram').withTags(WCAG_TAGS).analyze();
    expect(results.violations).toEqual([]);
  });
}

test('with reduced motion the architecture diagram buttons keep 0s transitions', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/en/work/apexflow');
  await expect(page.locator('app-case-diagram .diagram-btn').first()).toHaveCSS('transition-duration', '0s');
});
