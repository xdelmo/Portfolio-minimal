import { expect, test, type Locator, type Page } from './fixtures';

const ready = (page: Page) => expect(page.locator('app-home [data-motion]')).toHaveAttribute('data-motion', 'ready');
const scale = (el: Locator) => el.evaluate((node) => new DOMMatrix(getComputedStyle(node).transform).a);
// a project image keeps its perspective: what changes is the tip (rotation about x) and the title's slide
const tip = (el: Locator) => el.evaluate((node) => Math.abs(new DOMMatrix(getComputedStyle(node).transform).m23));
const slide = (el: Locator) => el.evaluate((node) => Math.abs(new DOMMatrix(getComputedStyle(node).transform).e));
const scrollTo = (page: Page, el: Locator, at: number) =>
  el.evaluate((node, at) => {
    window.scrollTo(0, node.getBoundingClientRect().top + scrollY - innerHeight * at);
  }, at);

test.describe('phones', () => {
  test.beforeEach(({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 1024, 'phone motion');
  });

  test('an experience card steps back as the next one slides over it', async ({ page }) => {
    await page.goto('/en/');
    await ready(page);
    const cards = page.locator('#experience .timeline > li');
    expect(await scale(cards.first())).toBe(1);
    await scrollTo(page, cards.nth(1), 0.15);
    await expect.poll(() => scale(cards.first())).toBeLessThan(0.99);
  });

  test('a project leans up and its title slides in as it scrolls into view', async ({ page }) => {
    await page.goto('/en/');
    await ready(page);
    const project = page.locator('#work .project').nth(1);
    expect(await tip(project.locator('.media'))).toBeGreaterThan(0.1);
    expect(await slide(project.locator('h3'))).toBeGreaterThan(10);
    await scrollTo(page, project, 0.1);
    await expect.poll(() => tip(project.locator('.media'))).toBeLessThan(0.01);
    await expect.poll(() => slide(project.locator('h3'))).toBeLessThan(0.5);
  });
});

test('a button gives way under the finger, like a key', async ({ page }) => {
  await page.goto('/en/');
  const button = page.locator('.hero .button').last();
  await button.scrollIntoViewIfNeeded();
  const box = await button.boundingBox();
  if (!box) throw new Error('no button');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect.poll(() => button.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).f)).toBe(2);
  await page.mouse.up();
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('projects and experience cards stay still on phones', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 1024, 'phone motion');
    await page.goto('/en/');
    await page.waitForTimeout(500);
    expect(await tip(page.locator('#work .project').nth(1).locator('.media'))).toBeLessThan(0.01);
    expect(await scale(page.locator('#experience .timeline > li').first())).toBe(1);
  });
});
