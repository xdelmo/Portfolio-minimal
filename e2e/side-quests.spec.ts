import { expect, test, type Page } from './fixtures';

const sprites = (page: Page) => page.locator('#side-quests app-quest-sprite');
const progress = (page: Page) => sprites(page).evaluateAll((els) => els.map((el) => parseFloat(getComputedStyle(el).getPropertyValue('--p') || '1')));

test('side quests sit on a lavender band, each with its own pixel sprite', async ({ page }) => {
  await page.goto('/en/');
  await expect(page.locator('#side-quests')).toHaveClass(/band--lavender/);
  await expect(sprites(page)).toHaveCount(3);
  for (const svg of await sprites(page).locator('svg').all()) {
    await expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(await svg.locator('path').count()).toBeGreaterThan(3);
  }
  const shapes = await sprites(page).evaluateAll((els) => els.map((el) => el.getAttribute('data-sprite')));
  expect(new Set(shapes).size).toBe(3);
});

test('the sprites assemble from their pixels as they scroll in', async ({ page }) => {
  await page.goto('/en/');
  await expect.poll(async () => Math.max(...(await progress(page)))).toBeLessThan(1);
  // on phones the items stack: bring the last one up to the middle of the screen
  await sprites(page).last().evaluate((el) => {
    window.scrollTo(0, el.getBoundingClientRect().top + scrollY - innerHeight * 0.3);
  });
  await expect.poll(async () => Math.min(...(await progress(page)))).toBe(1);
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('the sprites are whole from the start', async ({ page }) => {
    await page.goto('/en/');
    await page.waitForTimeout(500);
    expect(Math.min(...(await progress(page)))).toBe(1);
  });
});

test('sections leave 64px above and below their content, not 96', async ({ page }) => {
  await page.goto('/en/');
  const padding = await page.locator('#experience').evaluate((el) => [getComputedStyle(el).paddingTop, getComputedStyle(el).paddingBottom]);
  expect(padding).toEqual(['64px', '64px']);
});

test('the stack section passes under the side quests band, and the pixel thread stays over it', async ({ page }) => {
  await page.goto('/en/');
  // the stack rings scale in next to the band above them: paint order decides who is on top
  const order = await page.evaluate(() => {
    const z = (selector: string) => {
      const el = document.querySelector(selector);
      if (!el) return NaN;
      const style = getComputedStyle(el);
      return style.position === 'static' || style.zIndex === 'auto' ? 0 : Number(style.zIndex);
    };
    return { thread: z('app-thread'), band: z('#side-quests'), stack: z('#stack') };
  });
  expect(order.band).toBeGreaterThan(order.stack);
  expect(order.thread).toBeGreaterThan(order.band);
});
