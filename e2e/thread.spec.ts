import { expect, test, type Page } from './fixtures';

const thread = (page: Page) => page.locator('app-thread .thread');
const lit = (page: Page) => page.locator('app-thread .node.is-lit');

test('a pixel thread runs down the page and lights a node per section as it reaches it', async ({ page }) => {
  await page.goto('/en/');
  await expect(thread(page)).toBeVisible();
  await expect(page.locator('app-thread .node')).toHaveCount(5);
  await expect.poll(() => lit(page).count()).toBeLessThanOrEqual(1);

  await page.locator('#experience h2').evaluate((el) => {
    window.scrollTo(0, el.getBoundingClientRect().top + scrollY - innerHeight * 0.3);
  });
  // work, side quests and about are behind; stack still ahead
  await expect.poll(() => lit(page).count()).toBeGreaterThanOrEqual(3);
  expect(await lit(page).count()).toBeLessThan(5);

  await page.evaluate(() => {
    window.scrollTo(0, document.documentElement.scrollHeight);
  });
  await expect.poll(() => lit(page).count()).toBe(5);
});

test('the thread ends where the contact band begins: the finale is the arrival, not one more stop', async ({ page }) => {
  await page.goto('/en/');
  await expect(thread(page)).toBeVisible();
  const threadBottom = await thread(page).evaluate((el) => el.getBoundingClientRect().bottom + scrollY);
  const contactTop = await page.locator('#contact').evaluate((el) => el.getBoundingClientRect().top + scrollY);
  expect(threadBottom).toBeLessThanOrEqual(contactTop + 0.5); // sub-pixel rounding in Firefox
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('there is no thread', async ({ page }) => {
    await page.goto('/en/');
    await page.waitForTimeout(500);
    await expect(thread(page)).toBeHidden();
  });
});

test('while the experience deck is pinned the thread stands still with it, and its node stays on the title after', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the deck is pinned on desktop only');
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/en/');
  await expect(page.locator('#experience ol.is-stacked')).toHaveCount(1);
  const pinTop = await page.locator('#experience .deck').evaluate((el) => (el.parentElement?.getBoundingClientRect().top ?? 0) + scrollY);
  const pinLength = await page.locator('#experience .deck').evaluate((el) => (el.parentElement?.offsetHeight ?? 0) - el.offsetHeight);
  // the experience node sits on its title, and the dashes keep their place on screen
  const sample = () =>
    page.evaluate(() => {
      const nodes = [...document.querySelectorAll<HTMLElement>('app-thread .node')];
      const titles = [...document.querySelectorAll<HTMLElement>('.trail section[id] h2')];
      const i = titles.findIndex((t) => t.closest('#experience'));
      const node = nodes[i].getBoundingClientRect();
      const title = titles[i].getBoundingClientRect();
      const track = document.querySelector<HTMLElement>('app-thread .thread');
      if (!track) return { gap: Infinity, phase: NaN };
      const phase = (track.getBoundingClientRect().top + parseFloat(getComputedStyle(track).backgroundPositionY)) % 16;
      return { gap: Math.abs(node.top + node.height / 2 - (title.top + title.height / 2)), phase: (phase + 16) % 16 };
    });
  const header = 96;
  const seen: number[] = [];
  for (const into of [0, 0.5, 0.95]) {
    await page.evaluate((y) => { scrollTo(0, y); }, pinTop - header + pinLength * into);
    await expect.poll(async () => (await sample()).gap).toBeLessThan(8);
    seen.push((await sample()).phase);
  }
  // WebKit rounds the pinned scroll to whole pixels: a desync would be hundreds of pixels, not one
  expect(Math.max(...seen) - Math.min(...seen)).toBeLessThanOrEqual(2);
  // past the pin the section has moved down by the pin length, and the node with it
  await page.evaluate((y) => { scrollTo(0, y); }, pinTop + pinLength - header + 200);
  await expect.poll(async () => (await sample()).gap).toBeLessThan(8);
});
