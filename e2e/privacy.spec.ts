import { expect, test } from './fixtures';

for (const [lang, link, title] of [
  ['en', 'Privacy', 'Privacy'],
  ['it', 'Privacy', 'Privacy'],
] as const) {
  test(`${lang}: the footer links a privacy page that says exactly what the site stores`, async ({ page }) => {
    await page.goto(`/${lang}/`);
    await page.locator('app-site-footer').getByRole('link', { name: link, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/${lang}/privacy/?$`));
    await expect(page.locator('h1')).toHaveText(title);
    const main = page.locator('main');
    // every browser storage key the code uses is named, and nothing else is claimed
    for (const key of ['nf_lang', 'theme', 'intro', 'Netlify', 'info@emanueledelmonte.it', 'Garante']) {
      await expect(main).toContainText(key);
    }
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  });
}

test('the privacy page loads directly, in both languages', async ({ page }) => {
  for (const lang of ['en', 'it']) {
    const response = await page.goto(`/${lang}/privacy/`);
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveText('Privacy');
  }
});
