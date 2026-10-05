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
    const where = await page.evaluate(() => `scrollY ${String(scrollY)}, #work top ${String(document.querySelector('#work')?.getBoundingClientRect().top)}, height ${String(document.documentElement.scrollHeight)}, hash ${location.hash}`);
    await expect(page.locator('#work h2'), where).toBeInViewport();
  });
});

test('the motion library downloads only after the first paint, out of the way of the headline', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'paint timing is read in Chromium');
  await page.goto('/en/');
  await ready(page);
  const timing = await page.evaluate(async () => {
    const paint = performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? Infinity;
    const scripts = performance.getEntriesByType('resource').filter((entry) => entry.name.endsWith('.js'));
    // the GSAP chunk is the one with GSAP's core config (autoSleep); the browser serves it from its cache here
    for (const entry of scripts) {
      if ((await (await fetch(entry.name)).text()).includes('autoSleep')) return { paint, gsap: entry.startTime };
    }
    return { paint, gsap: -1 };
  });
  expect(timing.gsap).toBeGreaterThanOrEqual(timing.paint);
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
    await page.evaluate(() => { window.scrollTo(0, 400); }); // mouse.wheel does not exist in mobile WebKit
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

test('hovering a project shows the screenshot as it is, with no pixelated flash', async ({ page }) => {
  await page.goto('/en/');
  const project = page.locator('#work .project').first();
  await expect(project.locator('img')).toHaveCount(1);
  await expect(page.locator('#work .pixels')).toHaveCount(0);
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
        if (spacer && section) window.scrollTo(0, spacer.getBoundingClientRect().top + scrollY + spacer.offsetHeight - section.offsetHeight);
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

  test('stacks as sticky cards on phones, and lets the next section through', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'phones only');
    await page.goto('/en/');
    await ready(page);
    await expect(page.locator('.pin-spacer')).toHaveCount(0);
    const cards = await page.locator('#experience li').evaluateAll((items) =>
      items.map((li) => ({ position: getComputedStyle(li).position, top: parseFloat(getComputedStyle(li).top) })),
    );
    expect(cards.every((c) => c.position === 'sticky')).toBe(true);
    for (let i = 1; i < cards.length; i++) expect(cards[i].top).toBeGreaterThan(cards[i - 1].top);
    await page.locator('#stack h2').evaluate((el) => {
      window.scrollTo(0, el.getBoundingClientRect().top + scrollY - innerHeight * 0.5);
    });
    const title = await page.locator('#stack h2').boundingBox();
    const last = await page.locator('#experience li').last().boundingBox();
    if (!title || !last) throw new Error('missing boxes');
    expect(last.y + last.height).toBeLessThanOrEqual(title.y);
  });

  test('is not sticky on desktop', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop only');
    await page.goto('/en/');
    expect(await page.locator('#experience li').first().evaluate((li) => getComputedStyle(li).position)).not.toBe('sticky');
  });
});

test.describe('bands and finale', () => {
  test('about sits on a pastel band and contact on a dark one', async ({ page }) => {
    await page.goto('/en/');
    const bandColour = (id: string) => page.locator(`#${id}`).evaluate((el) => getComputedStyle(el, '::before').backgroundColor);
    expect(await bandColour('about')).toBe('rgb(185, 213, 245)');
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
        return parseFloat(await inset());
      }, { timeout: 8000 })
      // the scrub can stop a hair short of the end on slow devices: under a pixel is full bleed
      .toBeLessThan(0.5);
    await expect(page.locator('#contact h2')).toHaveAccessibleName('Get in touch');
    // the last line of the giant title has fully risen, even though the page ends before the trigger's end
    await expect
      .poll(() => page.locator('#contact .contact-label').evaluate((el) => {
        const lines = el.querySelectorAll<HTMLElement>(':scope > * > *');
        const last = lines[lines.length - 1] as HTMLElement | undefined;
        return last ? Math.round(new DOMMatrix(getComputedStyle(last).transform).m42) : 0;
      }))
      .toBe(0);
  });

  test('the contact text never sticks out of the band while it widens', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/en/');
    await ready(page);
    await page.evaluate(() => {
      const contact = document.getElementById('contact');
      if (contact) window.scrollTo(0, contact.getBoundingClientRect().top + scrollY - innerHeight * 0.8);
    });
    await page.waitForTimeout(300);
    const { bandEdge, textEdge } = await page.locator('#contact').evaluate((el) => {
      const inset = getComputedStyle(el).getPropertyValue('--band-inset').trim();
      const px = inset.endsWith('%') ? (parseFloat(inset) * document.documentElement.clientWidth) / 100 : parseFloat(inset);
      const left = Math.min(...[...el.querySelectorAll('h2, a, p')].map((n) => n.getBoundingClientRect().left));
      return { bandEdge: px, textEdge: left };
    });
    expect(bandEdge).toBeGreaterThan(0);
    expect(bandEdge).toBeLessThan(textEdge);
  });

  test('no progress bar runs along the header (removed on request)', async ({ page }) => {
    await page.goto('/en/');
    await ready(page);
    await expect(page.locator('.scroll-progress, app-scroll-progress')).toHaveCount(0);
  });
});

test.describe('stack on phones', () => {
  test('the title stays above the levels stepping in', async ({ page }) => {
    await page.goto('/en/');
    const style = await page.locator('#stack h2').evaluate((el) => ({ position: getComputedStyle(el).position, z: getComputedStyle(el).zIndex }));
    expect(style.position).toBe('relative');
    expect(Number(style.z)).toBeGreaterThan(0);
  });

});

test('with enlarged text, an experience card that would not fit under the header stops sticking', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      document.documentElement.style.fontSize = '150%';
    });
  });
  await page.goto('/en/');
  await page.locator('#experience').scrollIntoViewIfNeeded();
  // every card is either free to scroll or short enough to be read whole while it sticks
  await expect
    .poll(() =>
      page.locator('#experience li').evaluateAll((items) =>
        items.every((li) => getComputedStyle(li).position !== 'sticky' || parseFloat(getComputedStyle(li).top) + li.getBoundingClientRect().height <= innerHeight),
      ),
    )
    .toBe(true);
});
