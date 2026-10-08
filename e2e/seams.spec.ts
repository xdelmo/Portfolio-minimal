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

// puts the top of a seam at a fraction of the viewport height
const seamTopAt = (page: Page, where: string, fraction: number) =>
  seam(page, where).evaluate((el, f) => {
    window.scrollTo(0, el.getBoundingClientRect().top + scrollY - innerHeight * f);
  }, fraction);

for (const id of ['#about', '#side-quests', '#contact']) {
  test(`the ${id} band grows a pixel seam as it scrolls in`, async ({ page }) => {
    await page.goto('/en/');
    await expect(seam(page, id)).toHaveCount(1);
    await expect.poll(() => progress(page, id)).toBeLessThan(1);
    await seamTopAt(page, id, 0.4);
    await expect.poll(() => progress(page, id)).toBe(1);
  });
}

for (const where of ['.hero', '#about', '#side-quests']) {
  test(`the ${where} seam crumbles away as it scrolls out under the header, and forms again on the way back`, async ({ page }) => {
    await page.goto('/en/');
    await expect(page.locator('app-home [data-motion]')).toHaveAttribute('data-motion', 'ready');
    await seamTopAt(page, where, 0.4);
    await expect.poll(() => progress(page, where)).toBe(1);
    await seamTopAt(page, where, 0.2);
    await expect.poll(() => progress(page, where)).toBeGreaterThan(0);
    await expect.poll(() => progress(page, where)).toBeLessThan(1);
    await seamTopAt(page, where, 0.02);
    await expect.poll(() => progress(page, where)).toBe(0);
    await seamTopAt(page, where, 0.4);
    await expect.poll(() => progress(page, where)).toBe(1);
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

// Every seam runs from one edge of the window to the other (issue #85): on desktop the hero's grid placed its seam in
// the first column's area, which started it 16px in from the left and pushed it 16px past the right edge.
for (const width of [390, 1024, 1280, 1600]) {
  test(`every seam spans the whole window at ${String(width)}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/en/');
    const seams = await page.locator('app-pixel-dissolve.seam').evaluateAll((all) =>
      all.map((s) => {
        const r = s.getBoundingClientRect();
        return { seam: s.getAttribute('class') ?? '', left: Math.round(r.left), right: Math.round(r.right) };
      }),
    );
    expect(seams.length).toBeGreaterThan(0);
    const edge = await page.evaluate(() => document.documentElement.clientWidth);
    for (const s of seams) expect(s, s.seam).toMatchObject({ left: 0, right: edge });
  });
}
