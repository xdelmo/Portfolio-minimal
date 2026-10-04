import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './fixtures';

const other = (page: import('@playwright/test').Page, lang: 'en' | 'it') => page.locator(`.language-menu a[hreflang="${lang}"]`);

test('the language menu points to the same page in the other language', async ({ page }) => {
  await page.goto('/en/work/apexflow');
  await expect(other(page, 'it')).toHaveAttribute('href', '/it/work/apexflow');
  await page.goto('/it/');
  await expect(other(page, 'en')).toHaveAttribute('href', '/en/');
});

test('the language menu is a dropdown that says what it does', async ({ page }) => {
  await page.goto('/en/');
  const toggle = page.getByText('Language: English');
  await expect(toggle).toBeVisible();
  await expect(page.getByRole('link', { name: 'Italiano' })).toBeHidden();
  await toggle.click();
  await expect(page.getByRole('link', { name: 'Italiano' })).toBeVisible();
  await expect(page.locator('.language-menu [aria-current="true"]')).toHaveText(/English/);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('link', { name: 'Italiano' })).toBeHidden();
});

test('choosing a language remembers it for Netlify', async ({ page, context }) => {
  await page.goto('/en/');
  await page.getByText('Language: English').click();
  await page.getByRole('link', { name: 'Italiano' }).click();
  await expect(page).toHaveURL(/\/it\/$/);
  const cookies = await context.cookies();
  expect(cookies.find((c) => c.name === 'nf_lang')?.value).toBe('it');
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the language menu already points at the same page', async ({ page }) => {
    await page.goto('/en/work/apexflow');
    await expect(other(page, 'it')).toHaveAttribute('href', '/it/work/apexflow');
  });
});

test.describe('switching language', () => {
  const overlay = (page: import('@playwright/test').Page) =>
    page.evaluate(() => {
      const html = document.documentElement;
      return { name: html.dataset['langSwap'] ?? null, phase: html.dataset['langPhase'] ?? null };
    });

  test('a full-screen curtain covers the page with the new language, then lifts on arrival', async ({ page }) => {
    await page.goto('/en/');
    await page.getByText('English').first().click();
    await page.getByRole('link', { name: 'Italiano' }).click();
    // the old page is covered before it leaves
    await expect.poll(() => overlay(page)).toEqual({ name: 'Italiano', phase: 'out' });
    await page.waitForURL('**/it/');
    // the new page starts covered and uncovers itself, then drops the curtain
    await expect.poll(() => overlay(page)).toEqual({ name: null, phase: null });
    await expect(page.locator('html')).toHaveAttribute('lang', 'it');
  });

  test('the new page starts under the curtain before the app boots', async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('lang-swap', 'Italiano');
    });
    await page.route('**/*.js', (route) => route.abort());
    await page.goto('/it/');
    expect(await overlay(page)).toEqual({ name: 'Italiano', phase: 'in' });
  });

  test.describe('with reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });
    test('the language changes at once, without the curtain', async ({ page }) => {
      await page.goto('/en/');
      await page.getByText('English').first().click();
      await page.getByRole('link', { name: 'Italiano' }).click();
      await page.waitForURL('**/it/');
      expect(await overlay(page)).toEqual({ name: null, phase: null });
    });
  });
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`the open language menu meets WCAG 2.2 AA, ${colorScheme} theme (axe)`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto('/en/');
    await page.getByText('English').first().click();
    await expect(page.getByRole('link', { name: 'Italiano' })).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .include('app-language-switch')
      .analyze();
    expect(results.violations).toEqual([]);
  });
}
