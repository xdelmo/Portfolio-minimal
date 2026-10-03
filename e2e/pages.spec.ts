import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const PAGES = ['/en/', '/it/', '/en/work/apexflow', '/it/work/apexflow', '/en/404', '/it/404'];

for (const path of PAGES) {
  test.describe(path, () => {
    test('loads without console errors and scrolls to the footer', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(path);
      await expect(page.locator('h1')).toHaveCount(1);
      await page.locator('footer').scrollIntoViewIfNeeded();
      await expect(page.locator('footer')).toBeInViewport();
      expect(errors).toEqual([]);
    });

    for (const colorScheme of ['light', 'dark'] as const) {
      test(`meets WCAG 2.2 AA in the ${colorScheme} theme (axe)`, async ({ page }) => {
        await page.emulateMedia({ colorScheme });
        await page.goto(path);
        const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
        expect(results.violations).toEqual([]);
      });
    }
  });
}

test('pages declare the right language', async ({ page }) => {
  await page.goto('/it/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'it');
  await page.goto('/en/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('case study has canonical and hreflang links', async ({ page }) => {
  await page.goto('/it/work/apexflow');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://www.emanueledelmonte.it/it/work/apexflow');
  await expect(page.locator('link[hreflang="en"]')).toHaveAttribute('href', 'https://www.emanueledelmonte.it/en/work/apexflow');
  await expect(page.locator('link[hreflang="x-default"]')).toHaveCount(1);
});

test('the 404 page is localized and offers a way home', async ({ page }) => {
  await page.goto('/it/404');
  await expect(page.locator('h1')).toHaveText('Questa pagina non esiste');
  await expect(page.getByRole('link', { name: 'Vai alla home' })).toBeVisible();
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('content is still there', async ({ page }) => {
    await page.goto('/en/');
    await expect(page.locator('h1')).toContainText('Angular');
    await expect(page.getByRole('link', { name: 'ApexFlow' })).toBeVisible();
  });
});
