import { type Locator, type Page, expect, test } from './fixtures';

const ready = (page: Page) => expect(page.locator('app-home [data-motion]')).toHaveAttribute('data-motion', 'ready');
// SplitText wraps each line in a masking element; the title is back to plain text once its reveal is over
const isPlainText = (el: Locator) => el.evaluate((node) => node.children.length === 0);

test.describe('section titles', () => {
  test('rise line by line when they scroll in, then go back to plain text', async ({ page }) => {
    await page.goto('/en/');
    await ready(page);
    const title = page.locator('#experience h2');
    await expect.poll(() => isPlainText(title)).toBe(false);
    await expect(title).toHaveAccessibleName('Experience');
    await title.scrollIntoViewIfNeeded();
    await expect.poll(() => isPlainText(title), { timeout: 4000 }).toBe(true);
    await expect(title).toHaveText('Experience');
  });

  test('a title already in view on load is left alone', async ({ page }) => {
    await page.goto('/en/#work');
    await ready(page);
    expect(await isPlainText(page.locator('#work h2'))).toBe(true);
    await expect(page.locator('#work h2')).toBeInViewport();
  });
});

test.describe('hero', () => {
  test('a returning visitor sees the headline at once, never split or hidden', async ({ page }) => {
    await page.goto('/en/');
    await ready(page);
    expect(await isPlainText(page.locator('h1'))).toBe(true);
  });

  test('the headline drifts as the page scrolls', async ({ page }) => {
    await page.goto('/en/');
    await ready(page);
    await page.mouse.wheel(0, 400);
    await expect.poll(() => page.locator('h1').evaluate((el) => getComputedStyle(el).transform)).not.toBe('none');
  });

  test.describe('after the intro', () => {
    test.use({ intro: true });
    test('the headline rises line by line and ends as plain text', async ({ page }) => {
      await page.goto('/en/');
      await expect(page.locator('.site-intro')).toBeHidden({ timeout: 4000 });
      await expect.poll(() => isPlainText(page.locator('h1')), { timeout: 4000 }).toBe(true);
      await expect(page.locator('h1')).toBeInViewport();
    });
  });
});

test.describe('scroll-driven motion', () => {
  test.skip(({ browserName }) => browserName === 'firefox', 'no scroll-driven animations in Firefox: the line stays static');

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
    await expect(page.locator('app-home [data-motion]')).toHaveAttribute('data-motion', 'off');
    expect(await page.locator('#experience h2').evaluate((el) => el.children.length)).toBe(0);
    const line = page.locator('app-experience-timeline .timeline');
    expect(await line.evaluate((el) => getComputedStyle(el, '::before').animationName)).toBe('none');
  });
});

test('hovering a project flashes its pixelated copy once', async ({ page, browserName, isMobile }) => {
  test.skip(isMobile, 'no hover on touch screens');
  await page.goto('/en/');
  const project = page.locator('#work .project').first();
  const pixels = project.locator('.pixels');
  await project.hover();
  expect(await pixels.evaluate((el) => getComputedStyle(el).animationName)).toMatch(/depixelate$/);
  await expect.poll(() => pixels.evaluate((el) => (el as HTMLImageElement).naturalWidth)).toBe(40);
  expect(await pixels.getAttribute('aria-hidden'), browserName).toBe('true');
});

test.describe('project cards', () => {
  test.skip(({ isMobile }) => isMobile, 'mouse only');

  test('tilt the image toward the cursor and settle when it leaves', async ({ page }) => {
    await page.goto('/en/');
    await ready(page);
    const media = page.locator('#work .project .media').first();
    // hover() waits for the element to stop moving, so the box below is where the image really is
    await media.hover();
    const box = await media.boundingBox();
    if (!box) throw new Error('no media box');
    // sine of the rotation around the vertical axis, from the matrix3d (0 when the image faces the viewer)
    const lean = () =>
      media.evaluate((el) => {
        const m = /matrix3d\(([^)]+)\)/.exec(getComputedStyle(el).transform);
        return m ? Math.abs(Number(m[1].split(',')[2])) : 0;
      });
    await page.mouse.move(box.x + box.width * 0.9, box.y + box.height * 0.2);
    await page.mouse.move(box.x + box.width * 0.95, box.y + box.height * 0.1, { steps: 4 });
    await expect.poll(lean).toBeGreaterThan(0.05);
    await page.mouse.move(5, 5);
    await expect.poll(lean, { timeout: 2000 }).toBeLessThan(0.005);
  });
});
