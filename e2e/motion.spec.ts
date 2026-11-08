import { type Locator, type Page, expect, test } from './fixtures';

const ready = (page: Page) => expect(page.locator('app-home [data-motion]')).toHaveAttribute('data-motion', 'ready');
// SplitText wraps each line in a masking element; the title is back to plain text once its reveal is over
// (the headline's own two voice spans do not count)
const isPlainText = (el: Locator) =>
  el.evaluate((node) => [...node.children].every((child) => child.classList.contains('method') || child.classList.contains('voice')));

test.describe('section titles', () => {
  test('rise line by line when they scroll in, then go back to plain text', async ({ page }) => {
    await page.goto('/en/');
    await ready(page);
    const title = page.locator('#experience h2');
    await expect.poll(() => isPlainText(title)).toBe(false);
    await expect(title).toHaveAccessibleName('Experience');
    await title.scrollIntoViewIfNeeded();
    await expect.poll(() => isPlainText(title)).toBe(true);
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

  test('the curious half is the italic serif', async ({ page }) => {
    await page.goto('/en/');
    const voice = page.locator('.hero h1 .voice');
    expect(await voice.evaluate((el) => getComputedStyle(el).fontStyle)).toBe('italic');
    expect(await voice.evaluate((el) => getComputedStyle(el).fontFamily)).toMatch(/^"?Instrument Serif"?/);
    await expect(page.locator('head link[rel="preload"][href*="instrument-serif-latin-400-italic"]')).toHaveCount(1);
  });

  test('the headline drifts as the page scrolls', async ({ page }) => {
    await page.goto('/en/');
    await ready(page);
    await page.evaluate(() => { window.scrollTo(0, 400); }); // mouse.wheel does not exist in mobile WebKit
    await expect.poll(() => page.locator('h1').evaluate((el) => getComputedStyle(el).transform)).not.toBe('none');
  });

  test('the headline keeps its normal width while it scrolls away', async ({ page }) => {
    await page.goto('/en/');
    await ready(page);
    const wdth = () => page.locator('.hero h1').evaluate((el) => getComputedStyle(el).fontVariationSettings);
    expect(await wdth()).toContain('"wdth" 100');
    await page.evaluate(() => { window.scrollTo(0, 400); });
    expect(await wdth()).toContain('"wdth" 100');
  });

  test.describe('after the intro', () => {
    test.use({ intro: true });
    test('the headline rises line by line and ends as plain text', async ({ page }) => {
      await page.goto('/en/');
      // the panel lifts 3.6 s after the first render at the latest (the CSS fallback, or the GSAP timeline held to
      // its deadline); counted from the end of goto, and with WebKit in CI delivering frames late under load (a run
      // took the CSS path and ended past 4 s), 6 s is that bound plus the frames' lag
      await expect(page.locator('.site-intro')).toBeHidden({ timeout: 6000 });
      await expect.poll(() => isPlainText(page.locator('h1'))).toBe(true);
      await expect(page.locator('h1')).toBeInViewport();
    });

    // issue #251: the motion script came too late for the timeline, the CSS fallback lifts the panel, and the
    // squares used to stay one flat colour (black in the light theme) with the letters dim
    test('the squares are coloured and the letters lit even when the motion script is late', async ({ page, isMobile }) => {
      test.skip(isMobile, 'the intro is desktop only: on phones the squares are never animated');
      // every script is held until the same instant, 2 s from now (a delay per file would stack along the chain of
      // imports and the effect would start after the panel is gone): past the point where the whole timeline fits
      // before the fallback (3.6 s), so the letters and squares get their end state under the lifting panel
      const release = Date.now() + 2000;
      await page.route('**/*.js', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, Math.max(0, release - Date.now())));
        await route.continue();
      });
      await page.goto('/en/');
      await expect(page.locator('.px').first()).toHaveCSS('background-color', 'rgb(127, 178, 236)', { timeout: 5000 });
      await expect(page.locator('.letter').first()).toHaveCSS('opacity', '1');
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

test('project screenshots have no view-transition name so they do not scroll across the screen (issue #256)', async ({ page }) => {
  await page.goto('/en/');
  const shot = page.locator('#work .shot').first();
  await expect(shot).toHaveCSS('view-transition-name', 'none');
  await page.locator('#work h3 a').first().click();
  await expect(page.locator('.case-study .shot')).toHaveCSS('view-transition-name', 'none');
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

  // issue #340: parallax tilt removed from desktop hover
  test('do not tilt the image on mouse hover', async ({ page }) => {
    await page.goto('/en/');
    await ready(page);
    const media = page.locator('#work .project .media').first();
    await media.hover();
    const box = await media.boundingBox();
    if (!box) throw new Error('no media box');
    const lean = () =>
      media.evaluate((el) => {
        const m = /matrix3d\(([^)]+)\)/.exec(getComputedStyle(el).transform);
        return m ? Math.abs(Number(m[1].split(',')[2])) : 0;
      });
    await page.mouse.move(box.x + box.width * 0.9, box.y + box.height * 0.2);
    await page.mouse.move(box.x + box.width * 0.95, box.y + box.height * 0.1, { steps: 4 });
    expect(await lean()).toBe(0);
  });

  // issue #340: media container links directly to case study
  test('clicking the media preview navigates to the project case study', async ({ page }) => {
    await page.goto('/en/');
    await ready(page);
    const media = page.locator('#work .project .media').first();
    await media.click();
    await expect(page).toHaveURL(/\/work\/apexflow/);
  });

  // issue #340, #376: the pixel cursor snaps to the preview's arrow button from a little way off, and the button leans in
  test('the cursor snaps to the preview arrow button and the button leans towards the pointer', async ({ page }) => {
    await page.goto('/en/');
    await ready(page);
    const arrow = page.locator('#work .project .media-arrow').first();
    await expect(arrow).toHaveAttribute('data-snap', '');
    await arrow.scrollIntoViewIfNeeded();
    const box = await arrow.boundingBox();
    if (!box) throw new Error('no arrow box');
    // far from the button, in the middle of the picture
    const media = await page.locator('#work .project .media').first().boundingBox();
    if (!media) throw new Error('no media box');
    await page.mouse.move(media.x + media.width / 2, media.y + media.height / 2);
    await page.mouse.move(media.x + media.width / 3, media.y + media.height / 2, { steps: 4 });
    const lean = () => arrow.evaluate((el) => parseFloat(getComputedStyle(el).translate.split(' ')[0]) || 0);
    await expect.poll(lean).toBeLessThan(-0.5);
    // the pixel is a frame centred on the button, not on the pointer
    const offset = async () => {
      const now = await arrow.boundingBox();
      const dot = await page.locator('.pixel-cursor').boundingBox();
      if (!now || !dot) throw new Error('no box');
      return Math.hypot(dot.x + dot.width / 2 - (now.x + now.width / 2), dot.y + dot.height / 2 - (now.y + now.height / 2));
    };
    await expect.poll(offset).toBeLessThan(3);
    await page.mouse.move(5, 5);
    await expect.poll(lean).toBeGreaterThan(-0.05);
  });
});

test.describe('experience', () => {
  test('is pinned on desktop while its entries stack, and the pin goes away with the page', async ({ page, isMobile }) => {
    test.skip(isMobile, 'no pin on phones');
    await page.goto('/en/');
    await ready(page);
    await expect(page.locator('#experience .pin-spacer > .deck')).toHaveCount(1);
    const entries = page.locator('#experience .timeline > li');
    const last = entries.last();
    // scroll to the end of the pinned stretch: the last entry has arrived on top of the deck. Scroll again on every
    // attempt, because late content (the moai, images) can still move the pin while the page settles
    const lastAtEnd = () =>
      page.evaluate(() => {
        const spacer = document.querySelector<HTMLElement>('#experience .pin-spacer');
        const section = document.querySelector<HTMLElement>('#experience .deck');
        // the pin ends once the spacer's extra height (spacer minus section) has been scrolled
        if (spacer && section) window.scrollTo(0, spacer.getBoundingClientRect().top + scrollY + spacer.offsetHeight - section.offsetHeight);
        const items = document.querySelectorAll('#experience .timeline > li');
        // vertical offset of the last card: 0 once it has slid onto the deck
        return Math.round(new DOMMatrix(getComputedStyle(items[items.length - 1]).transform).m42);
      });
    await expect.poll(lastAtEnd, { timeout: 8000 }).toBe(0);
    await expect(last).toBeInViewport();
    await page.locator('#work h3 a').first().click();
    await expect(page).toHaveURL(/\/work\//);
    await expect(page.locator('#experience .pin-spacer')).toHaveCount(0);
    await page.goBack();
    await ready(page);
    await expect(page.locator('#experience .pin-spacer')).toHaveCount(1);
  });

  test('stacks as sticky cards on phones, and lets the next section through', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'phones only');
    await page.goto('/en/');
    await ready(page);
    await expect(page.locator('.pin-spacer')).toHaveCount(0);
    const cards = await page.locator('#experience .timeline > li').evaluateAll((items) =>
      items.map((li) => ({ position: getComputedStyle(li).position, top: parseFloat(getComputedStyle(li).top) })),
    );
    expect(cards.every((c) => c.position === 'sticky')).toBe(true);
    for (let i = 1; i < cards.length; i++) expect(cards[i].top).toBeGreaterThan(cards[i - 1].top);
    await page.locator('#stack h2').evaluate((el) => {
      window.scrollTo(0, el.getBoundingClientRect().top + scrollY - innerHeight * 0.5);
    });
    const title = await page.locator('#stack h2').boundingBox();
    const last = await page.locator('#experience .timeline > li').last().boundingBox();
    if (!title || !last) throw new Error('missing boxes');
    expect(last.y + last.height).toBeLessThanOrEqual(title.y);
  });

  // the smallest phone screen we test (iPhone 15): a card that does not fit whole under the header stops sticking
  for (const locale of ['en', 'it']) {
    test(`every job card fits under the header on a small phone (${locale})`, async ({ page, isMobile }) => {
      test.skip(!isMobile, 'phones only');
      await page.setViewportSize({ width: 393, height: 659 });
      await page.goto(`/${locale}/`);
      await ready(page);
      const fits = await page.locator('#experience .timeline > li').evaluateAll((items) =>
        items.map((li) => parseFloat(getComputedStyle(li).top) + li.getBoundingClientRect().height + 16 <= innerHeight),
      );
      expect(fits).toEqual(fits.map(() => true));
    });
  }

  test('the chapter track fills with the deck, marks the job on top and jumps to a job on click', async ({ page, isMobile }) => {
    test.skip(isMobile, 'the deck is desktop only');
    await page.goto('/en/');
    await ready(page);
    await expect(page.locator('#experience .pin-spacer > .deck')).toHaveCount(1);
    const chapters = page.locator('#experience nav.chapters a');
    await expect(chapters).toHaveCount(3);
    // at the start of the pin only the first chapter is lit and current
    await page.evaluate(() => {
      const spacer = document.querySelector<HTMLElement>('#experience .pin-spacer');
      if (spacer) window.scrollTo(0, spacer.getBoundingClientRect().top + scrollY - 96 + 2);
    });
    await expect(chapters.first()).toHaveAttribute('aria-current', 'step');
    await expect.poll(() => chapters.last().evaluate((a) => getComputedStyle(a).getPropertyValue('--fill'))).toBe('0');
    // a click on the current job's chapter scrolls the pin to where its card is on top
    await chapters.last().click();
    await expect(chapters.last()).toHaveAttribute('aria-current', 'step');
    await expect(page.locator('#exp-2')).toBeFocused();
    await expect.poll(() => page.locator('#exp-2').evaluate((li) => Math.round(new DOMMatrix(getComputedStyle(li).transform).m42))).toBe(0);
  });

  test('is not sticky on desktop', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop only');
    await page.goto('/en/');
    expect(await page.locator('#experience .timeline > li').first().evaluate((li) => getComputedStyle(li).position)).not.toBe('sticky');
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
    // hard edges while it widens, like every block of the design (issue #173)
    expect(await page.locator('#contact').evaluate((el) => getComputedStyle(el, '::before').clipPath)).not.toContain('round');
    await expect
      .poll(async () => {
        await page.evaluate(() => {
          window.scrollTo(0, document.documentElement.scrollHeight);
        });
        return parseFloat(await inset());
      }, { timeout: 8000 })
      // the scrub can stop a hair short of the end on slow devices: under a pixel is full bleed
      .toBeLessThan(0.5);
    await expect(page.locator('#contact h2')).toHaveAccessibleName('Let’s talk');
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
      page.locator('#experience .timeline > li').evaluateAll((items) =>
        items.every((li) => getComputedStyle(li).position !== 'sticky' || parseFloat(getComputedStyle(li).top) + li.getBoundingClientRect().height <= innerHeight),
      ),
    )
    .toBe(true);
});
