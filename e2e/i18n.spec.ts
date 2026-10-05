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

  test('the curtain slides on the compositor, with a smooth ease (not stepped clip-path)', async ({ page }) => {
    await page.goto('/en/');
    await page.getByText('English').first().click();
    await page.getByRole('link', { name: 'Italiano' }).click();
    const curtain = await page.evaluate(() => {
      const anim = document.getAnimations().find((a) => (a.effect as KeyframeEffect | null)?.pseudoElement === '::after');
      const effect = anim?.effect as KeyframeEffect | undefined;
      if (!effect) return null;
      return { props: Object.keys(effect.getKeyframes()[0]).filter((k) => !['offset', 'easing', 'composite', 'computedOffset'].includes(k)), easing: effect.getComputedTiming().easing ?? '', keyEasing: effect.getKeyframes()[0].easing };
    });
    expect(curtain).not.toBeNull();
    expect(curtain?.props).toEqual(['transform']);
    expect(`${curtain?.easing ?? ''} ${curtain?.keyEasing ?? ''}`).not.toContain('steps');
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

test('a page load runs no view transition of its own: the curtain is the only thing that moves', async ({ page }) => {
  await page.addInitScript(() => {
    const seen: string[] = [];
    (window as unknown as { seen: string[] }).seen = seen;
    document.addEventListener('animationstart', (e) => { if (e.animationName.includes('view-transition')) seen.push(e.animationName); }, true);
  });
  await page.goto('/it/');
  await page.waitForTimeout(800);
  expect(await page.evaluate(() => (window as unknown as { seen: string[] }).seen)).toEqual([]);
});

test('the open language list has no padding: its items reach its edges', async ({ page }) => {
  await page.goto('/en/');
  await page.getByText('Language: English').click();
  await expect(page.locator('.language-menu ul')).toHaveCSS('padding', '0px');
});
