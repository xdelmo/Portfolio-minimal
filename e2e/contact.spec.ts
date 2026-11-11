import { readFileSync } from 'node:fs';
import { expect, test } from './fixtures';

const EMAIL = 'info@emanueledelmonte.it';
const { version } = JSON.parse(readFileSync('package.json', 'utf8')) as { version: string };

test.describe('contact finale', () => {
  for (const [lang, name, lede] of [
    ['en', 'Let’s talk', 'Hiring for a frontend role?'],
    ['it', 'Parliamone', 'Cerchi chi segua il frontend?'],
  ] as const) {
    test(`${lang}: the giant title is the LinkedIn link (#472), under one sentence on what to write about`, async ({ page }) => {
      await page.goto(`/${lang}/`);
      const contact = page.locator('#contact');
      const title = contact.getByRole('link', { name, exact: true });
      await expect(title).toHaveAttribute('href', 'https://www.linkedin.com/in/emanueledelmonte/');
      await expect(title).toHaveAttribute('target', '_blank');
      await expect(title).toHaveAttribute('rel', 'me noopener');
      await expect(title).toHaveAttribute('aria-describedby', 'new-tab');
      await expect(contact.locator('h2')).toHaveAccessibleName(name);
      await expect(contact).toContainText(lede);
      // the title is the way to write: the address itself is not printed (removed on request)
      await expect(contact).not.toContainText(EMAIL);
    });
  }

  // SplitText's default aria-label on the split <span> is not allowed on its role: Lighthouse flagged it (issue #354)
  test('the split title label carries no aria-label, and the link keeps its name', async ({ page }) => {
    await page.goto('/en/');
    const label = page.locator('#contact .contact-label');
    // the split ran: the label's lines are wrapped in masks
    await expect(label.locator('div').first()).toBeAttached();
    await expect(label).not.toHaveAttribute('aria-label');
    // the masks clip only below: sideways they would cut the italic last letter (issue #352)
    const mask = label.locator('div').first();
    await expect(mask).toHaveCSS('overflow-x', 'visible');
    await expect(mask).toHaveCSS('clip-path', /inset/);
    const text = ((await label.textContent()) ?? '').replace(/\s+/g, ' ').trim();
    await expect(page.locator('#contact .contact-link')).toHaveAccessibleName(text);
  });

  // issue #472: copy email button removed, profiles list LinkedIn and GitHub only
  test('there is no copy email button in contact, profiles lists LinkedIn and GitHub (#472)', async ({ page }) => {
    await page.goto('/en/');
    await expect(page.locator('#contact').getByRole('button')).toHaveCount(0);
    await expect(page.locator('#contact .profiles').getByRole('listitem')).toHaveCount(2);
  });

  test.describe('without JavaScript', () => {
    test.use({ javaScriptEnabled: false });
    test('there is no button in contact, profiles lists LinkedIn and GitHub', async ({ page }) => {
      await page.goto('/en/');
      await expect(page.locator('#contact').getByRole('button')).toHaveCount(0);
      await expect(page.locator('#contact .profiles').getByRole('listitem')).toHaveCount(2);
    });
  });

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
    await expect(footer.locator('p')).toHaveText(`© ${String(new Date().getFullYear())} Emanuele Del Monte · v${version}`);
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
