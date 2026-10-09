import { expect, test } from './fixtures';

const EMAIL = 'info@emanueledelmonte.it';

test.describe('contact finale', () => {
  for (const [lang, name, lede, availability] of [
    ['en', 'Get in touch', 'Building something with Angular, or hiring for a frontend role? Write to me.', 'Open to remote roles.'],
    ['it', 'Contatti', 'Stai costruendo qualcosa con Angular o cerchi chi segua il frontend? Scrivimi.', 'Disponibile per ruoli da remoto.'],
  ] as const) {
    test(`${lang}: the giant title is the email link, under one sentence on what to write about`, async ({ page }) => {
      await page.goto(`/${lang}/`);
      const contact = page.locator('#contact');
      const title = contact.getByRole('link', { name, exact: true });
      await expect(title).toHaveAttribute('href', `mailto:${EMAIL}`);
      await expect(contact.locator('h2')).toHaveAccessibleName(name);
      await expect(contact).toContainText(lede);
      await expect(contact).toContainText(availability);
      // the title is the way to write: the address itself is not printed (removed on request)
      await expect(contact).not.toContainText(EMAIL);
    });
  }

  test('LinkedIn and GitHub are pixel-mark tags in the finale, marked as my profiles', async ({ page }) => {
    await page.goto('/en/');
    for (const profile of ['LinkedIn', 'GitHub']) {
      const tag = page.locator('#contact').getByRole('link', { name: profile });
      await expect(tag).toHaveAttribute('rel', /\bme\b/);
      await expect(tag.locator('svg[shape-rendering="crispEdges"]')).toHaveCount(1);
    }
  });

});

test.describe('footer', () => {
  test('ends the page with the year, my profiles and a way back up, without repeating the address', async ({ page }) => {
    await page.goto('/en/');
    const footer = page.locator('app-site-footer footer');
    await expect(footer.locator('p')).toHaveText(`© ${String(new Date().getFullYear())} Emanuele Del Monte`);
    await expect(footer.getByRole('link', { name: 'Email' })).toHaveAttribute('href', `mailto:${EMAIL}`);
    await expect(footer.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute('rel', /\bme\b/);
    await expect(footer.getByRole('link', { name: 'GitHub' })).toHaveAttribute('rel', /\bme\b/);
    await expect(footer).not.toContainText(EMAIL);
  });

  test('"Back to top" scrolls up and stays on the case study', async ({ page }) => {
    await page.goto('/it/work/apexflow');
    await page.locator('app-site-footer').scrollIntoViewIfNeeded();
    await page.locator('app-site-footer').getByRole('link', { name: 'Torna su' }).click();
    await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(2);
    await expect(page).toHaveURL(/\/it\/work\/apexflow$/);
    await expect(page.locator('main')).toBeFocused();
  });

  test('"Press start" opens the player card, and closing it gives the focus back', async ({ page }) => {
    await page.goto('/en/');
    const start = page.locator('app-site-footer').getByRole('button', { name: 'Press start' });
    // the console's start key in pixels, above its label
    await expect(start.locator('svg[shape-rendering="crispEdges"]')).toHaveCount(1);
    await expect(start).toHaveText('Start');
    await start.click();
    const card = page.getByRole('dialog', { name: 'Pause' });
    await expect(card).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(card).toHaveCount(0);
    await expect(start).toBeFocused();
  });

  test.describe('without JavaScript', () => {
    test.use({ javaScriptEnabled: false });
    test('there is no "Press start" that would do nothing', async ({ page }) => {
      await page.goto('/en/');
      await expect(page.locator('app-site-footer').getByRole('button', { name: 'Press start' })).toHaveCount(0);
    });
  });
});
