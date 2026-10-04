import { type Locator, expect, test } from '@playwright/test';

const clip = (el: Locator) => el.evaluate((node) => getComputedStyle(node).clipPath);
// every inset at zero, however the browser serialises it
const UNCLIPPED = /^(none|inset\((0(px|%)?\s?)+\))$/;

test.describe('scroll-driven motion', () => {
  test.skip(({ browserName }) => browserName === 'firefox', 'no scroll-driven animations in Firefox: titles and the line stay static');

  test('section titles reveal on scroll and end fully visible', async ({ page }) => {
    await page.goto('/en/');
    const title = page.locator('#experience h2');
    expect(await title.evaluate((el) => getComputedStyle(el).animationName)).toBe('reveal-title');
    await title.scrollIntoViewIfNeeded();
    await page.evaluate(() => {
      window.scrollBy(0, window.innerHeight / 3);
    });
    await expect.poll(() => clip(title)).toMatch(UNCLIPPED);
  });

  test('a title already in view on load is not left clipped', async ({ page }) => {
    await page.goto('/en/#work');
    await expect.poll(() => clip(page.locator('#work h2'))).toMatch(UNCLIPPED);
  });

  test('the experience line draws with scroll', async ({ page }) => {
    await page.goto('/en/');
    const line = page.locator('app-experience-timeline .timeline');
    // component keyframes get Angular's scoping prefix
    expect(await line.evaluate((el) => getComputedStyle(el, '::before').animationName)).toMatch(/draw-line$/);
  });
});

test('project title and case-study heading share a view-transition name', async ({ page }) => {
  await page.goto('/en/');
  const card = page.locator('#work h3').first();
  const name = await card.evaluate((el) => getComputedStyle(el).viewTransitionName);
  expect(name).toMatch(/^title-/);
  await card.locator('a').click();
  await expect(page.locator('h1')).toHaveCSS('view-transition-name', name);
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('titles and the line do not animate', async ({ page }) => {
    await page.goto('/en/');
    expect(await page.locator('#experience h2').evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
    const line = page.locator('app-experience-timeline .timeline');
    expect(await line.evaluate((el) => getComputedStyle(el, '::before').animationName)).toBe('none');
  });
});
