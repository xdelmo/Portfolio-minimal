import { expect, test, type Page } from './fixtures';

const experienceTop = (page: Page) => page.evaluate(() => document.querySelector('#experience')?.getBoundingClientRect().top ?? NaN);
// the header nav is a desktop thing; phones reach the sections by scrolling
const navLink = (page: Page) => page.locator('.site-header > nav a', { hasText: 'Experience' });

/** Clicks the header link and returns every scroll position the page went through on its way to the section. */
async function travel(page: Page): Promise<number[]> {
  await page.evaluate(() => {
    const w = window as unknown as { positions: number[] };
    w.positions = [];
    addEventListener('scroll', () => w.positions.push(window.scrollY));
  });
  await navLink(page).click();
  await expect.poll(() => experienceTop(page), { timeout: 4000 }).toBeLessThanOrEqual(113);
  await page.waitForTimeout(200);
  expect(await experienceTop(page)).toBeGreaterThanOrEqual(111); // under the 96px header, plus the section's 16px scroll-margin
  return page.evaluate(() => (window as unknown as { positions: number[] }).positions);
}

test('a header link glides to its section instead of jumping, and stops under the header', async ({ page, browserName }) => {
  // headless WebKit on Linux (CI) leaves smooth scrolling to a platform setting and often jumps; Safari glides
  test.skip(browserName === 'webkit', 'smooth scrolling is a platform setting in headless WebKitGTK');
  await page.goto('/en/');
  test.skip(!(await navLink(page).isVisible()), 'no header nav on this viewport');
  const positions = await travel(page);
  const final = positions.at(-1) ?? 0;
  // WebKit on Linux glides in a single step: one position on the way is enough to tell it from a jump
  expect(positions.filter((y) => y > 0 && y < final - 1).length).toBeGreaterThan(0);
});

test('a page opened at an anchor stays on its section once the headline font is in', async ({ page }) => {
  // the font arrives after the browser has scrolled to the anchor with the hero set in the wider fallback font
  await page.route('**/*.woff2', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 80));
    await route.continue();
  });
  await page.goto('/en/#work');
  await page.waitForLoadState('load');
  // the section starts under the header, plus its 16px scroll-margin
  const offset = () =>
    page.evaluate(() => (document.querySelector('#work')?.getBoundingClientRect().top ?? NaN) - (document.querySelector('app-site-header')?.getBoundingClientRect().height ?? NaN) - 16);
  await expect.poll(async () => Math.abs(await offset())).toBeLessThanOrEqual(1);
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('a header link moves to its section at once', async ({ page }) => {
    await page.goto('/en/');
    test.skip(!(await navLink(page).isVisible()), 'no header nav on this viewport');
    const positions = await travel(page);
    expect(new Set(positions).size).toBe(1);
  });
});
