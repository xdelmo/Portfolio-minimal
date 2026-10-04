import { expect, test } from '@playwright/test';

test('the language switch points to the same page in the other language', async ({ page }) => {
  await page.goto('/en/work/apexflow');
  await expect(page.locator('a.language-switch')).toHaveAttribute('href', '/it/work/apexflow');
  await page.goto('/it/');
  await expect(page.locator('a.language-switch')).toHaveAttribute('href', '/en/');
});

test('using the switch remembers the choice for Netlify', async ({ page, context }) => {
  await page.goto('/en/');
  await page.locator('a.language-switch').click();
  await expect(page).toHaveURL(/\/it\/$/);
  const cookies = await context.cookies();
  expect(cookies.find((c) => c.name === 'nf_lang')?.value).toBe('it');
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the language switch already points at the same page', async ({ page }) => {
    await page.goto('/en/work/apexflow');
    await expect(page.locator('.language-switch')).toHaveAttribute('href', '/it/work/apexflow');
  });
});
