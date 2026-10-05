import { expect, test, type Page } from './fixtures';

const seam = (page: Page, where: string) => page.locator(`${where} app-pixel-dissolve.seam`);
const progress = (page: Page, where: string) =>
  seam(page, where).evaluate((el) => parseFloat(getComputedStyle(el).getPropertyValue('--p') || '1'));

test('the hero ends in a pixel seam', async ({ page }) => {
  await page.goto('/en/');
  await expect(seam(page, '.hero')).toHaveCount(1);
  await expect(seam(page, '.hero').locator('svg')).toHaveAttribute('aria-hidden', 'true');
});

for (const [width, height] of [[1440, 900], [1920, 1080]]) {
  test(`on a ${String(width)}×${String(height)} desktop the hero seam sits on the bottom edge of the first screen, under the header`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/en/');
    const box = await seam(page, '.hero').boundingBox();
    expect(Math.abs((box?.y ?? 0) + (box?.height ?? 0) - height)).toBeLessThanOrEqual(1);
  });
}

for (const id of ['#about', '#side-quests', '#contact']) {
  test(`the ${id} band grows a pixel seam as it scrolls in`, async ({ page }) => {
    await page.goto('/en/');
    await expect(seam(page, id)).toHaveCount(1);
    await expect.poll(() => progress(page, id)).toBeLessThan(1);
    await page.locator(id).evaluate((el) => {
      window.scrollTo(0, el.getBoundingClientRect().top + scrollY - innerHeight * 0.2);
    });
    await expect.poll(() => progress(page, id)).toBe(1);
  });
}

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('the seams are already formed', async ({ page }) => {
    await page.goto('/en/');
    await page.waitForTimeout(500);
    expect(await progress(page, '#about')).toBe(1);
    expect(await progress(page, '#side-quests')).toBe(1);
    expect(await progress(page, '#contact')).toBe(1);
  });
});

test('project images show at once, with no pixel veil over them (removed on request)', async ({ page }) => {
  await page.goto('/en/');
  await expect(page.locator('#work .media')).not.toHaveCount(0);
  await expect(page.locator('#work app-pixel-dissolve')).toHaveCount(0);
});
