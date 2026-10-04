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
    await expect(page.locator('.pin-spacer')).toHaveCount(0);
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

test.describe('experience', () => {
  test('is pinned on desktop while its entries stack, and the pin goes away with the page', async ({ page, isMobile }) => {
    test.skip(isMobile, 'no pin on phones');
    await page.goto('/en/');
    await ready(page);
    await expect(page.locator('.pin-spacer #experience')).toHaveCount(1);
    const entries = page.locator('#experience li');
    const last = entries.last();
    // scroll to the end of the pinned stretch: the last entry has arrived on top of the deck. Scroll again on every
    // attempt, because late content (the moai, images) can still move the pin while the page settles
    const lastAtEnd = () =>
      page.evaluate(() => {
        const spacer = document.querySelector<HTMLElement>('.pin-spacer');
        const section = document.getElementById('experience');
        // the pin ends once the spacer's extra height (spacer minus section) has been scrolled
        if (spacer && section) window.scrollTo(0, spacer.offsetTop + spacer.offsetHeight - section.offsetHeight);
        const items = document.querySelectorAll('#experience li');
        // vertical offset of the last card: 0 once it has slid onto the deck
        return Math.round(new DOMMatrix(getComputedStyle(items[items.length - 1]).transform).m42);
      });
    await expect.poll(lastAtEnd, { timeout: 8000 }).toBe(0);
    await expect(last).toBeInViewport();
    await page.locator('#work h3 a').first().click();
    await expect(page).toHaveURL(/\/work\//);
    await expect(page.locator('.pin-spacer')).toHaveCount(0);
    await page.goBack();
    await ready(page);
    await expect(page.locator('.pin-spacer')).toHaveCount(1);
  });

  test('is a plain list on phones', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'phones only');
    await page.goto('/en/');
    await ready(page);
    await expect(page.locator('.pin-spacer')).toHaveCount(0);
    await expect(page.locator('#experience ol')).not.toHaveClass(/is-stacked/);
  });
});

test.describe('stack orbs', () => {
  // translation of an orb away from its place on the ring (0 when it sits there)
  const drift = (orb: Locator) => orb.evaluate((el) => {
    const m = new DOMMatrix(getComputedStyle(el).transform);
    return Math.round(Math.hypot(m.m41, m.m42));
  });

  test('gather onto the ring as the section reaches the middle of the screen', async ({ page }) => {
    await page.goto('/en/');
    await ready(page);
    const orbs = page.locator('#stack .orb');
    // one orb per stack group
    await expect(orbs).toHaveCount(await page.locator('#stack .group').count());
    await expect(page.locator('#stack .orbs')).toHaveAttribute('aria-hidden', 'true');
    expect(await drift(orbs.first())).toBeGreaterThan(20);
    await expect
      .poll(async () => {
        await page.evaluate(() => {
          const section = document.getElementById('stack');
          if (section) window.scrollTo(0, section.getBoundingClientRect().top + scrollY + section.offsetHeight / 2 - innerHeight / 2);
        });
        return drift(orbs.first());
      }, { timeout: 8000 })
      .toBe(0);
  });

  test.describe('with reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });
    test('already sit on the ring', async ({ page }) => {
      await page.goto('/en/');
      await expect(page.locator('#stack .orb')).toHaveCount(await page.locator('#stack .group').count());
      expect(await drift(page.locator('#stack .orb').first())).toBe(0);
    });
  });
});

test.describe('bands and finale', () => {
  test('about sits on a pastel band and contact on a dark one', async ({ page }) => {
    await page.goto('/en/');
    const bandColour = (id: string) => page.locator(`#${id}`).evaluate((el) => getComputedStyle(el, '::before').backgroundColor);
    expect(await bandColour('about')).toBe('rgb(168, 224, 200)');
    expect(await bandColour('contact')).toBe('rgb(29, 29, 28)');
  });

  test('the contact band widens to full bleed as it scrolls in', async ({ page }) => {
    await page.goto('/en/');
    await ready(page);
    const inset = () => page.locator('#contact').evaluate((el) => getComputedStyle(el).getPropertyValue('--band-inset').trim());
    expect(await inset()).not.toMatch(/^0(%|px)?$/);
    await expect
      .poll(async () => {
        await page.evaluate(() => {
          window.scrollTo(0, document.documentElement.scrollHeight);
        });
        return inset();
      }, { timeout: 8000 })
      .toMatch(/^0(%|px)?$/);
    await expect(page.locator('#contact h2')).toHaveAccessibleName('Get in touch');
    // the last line of the giant title has fully risen, even though the page ends before the trigger's end
    await expect
      .poll(() => page.locator('#contact h2').evaluate((el) => {
        const lines = el.querySelectorAll<HTMLElement>(':scope > * > *');
        const last = lines[lines.length - 1] as HTMLElement | undefined;
        return last ? Math.round(new DOMMatrix(getComputedStyle(last).transform).m42) : 0;
      }))
      .toBe(0);
  });

  test('a progress bar follows the scroll', async ({ page }) => {
    await page.goto('/en/');
    await ready(page);
    const bar = page.locator('.scroll-progress');
    await expect(bar).toHaveAttribute('aria-hidden', 'true');
    const scale = () => bar.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a);
    expect(await scale()).toBeLessThan(0.05);
    await expect
      .poll(async () => {
        await page.evaluate(() => {
          window.scrollTo(0, document.documentElement.scrollHeight);
        });
        return scale();
      }, { timeout: 8000 })
      .toBeGreaterThan(0.95);
  });
});
