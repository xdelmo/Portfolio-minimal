import { type Locator, type Page, expect, test } from './fixtures';

const ready = (page: Page) => expect(page.locator('app-home [data-motion]')).toHaveAttribute('data-motion', 'ready');
// SplitText wraps each line in a masking element; the headline is back to plain text once its reveal is over
// (its own two voice spans do not count)
const isPlainText = (el: Locator) =>
  el.evaluate((node) => [...node.children].every((child) => child.classList.contains('method') || child.classList.contains('voice')));

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
      // the panel lifts 3.6 s after the first render at the latest (2 s on phones) (the CSS fallback, or the GSAP timeline held to
      // its deadline); counted from the end of goto, and with WebKit in CI delivering frames late under load (a run
      // took the CSS path and ended past 4 s), 6 s is that bound plus the frames' lag
      await expect(page.locator('.site-intro')).toBeHidden({ timeout: 6000 });
      await expect.poll(() => isPlainText(page.locator('h1'))).toBe(true);
      await expect(page.locator('h1')).toBeInViewport();
    });

    // issue #251: the motion script came too late for the timeline, the CSS fallback lifts the panel, and the
    // squares used to stay one flat colour (black in the light theme) with the letters dim
    test('the squares are coloured and the letters lit even when the motion script is late', async ({ page, isMobile }) => {
      // every script is held until the same instant, 2 s from now (a delay per file would stack along the chain of
      // imports and the effect would start after the panel is gone): past the point where the whole timeline fits
      // before the fallback (3.6 s), so the letters and squares get their end state under the lifting panel. Phones
      // lift by 2 s with a faster timeline (issue #381), so there the same moment comes at 0.9 s
      const release = Date.now() + (isMobile ? 900 : 2000);
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

test('project titles have no view-transition name so they do not slide across the rising page (issue #551)', async ({ page }) => {
  await page.goto('/en/');
  await expect(page.locator('#work h3').first()).toHaveCSS('view-transition-name', 'none');
  await page.locator('#work h3 a').first().click();
  await expect(page.locator('.case-study h1')).toHaveCSS('view-transition-name', 'none');
});

test('the pixel cursor has its own view-transition name so it does not rise with the page (issue #560)', async ({ page }) => {
  await page.goto('/en/');
  await expect(page.locator('.pixel-cursor')).toHaveCSS('view-transition-name', 'pixel-cursor');
  await expect(page.locator('.pixel-arrow')).toHaveCSS('view-transition-name', 'pixel-arrow');
});

test('a page change slides the new page up as a sheet over the dimming old one (issue #555)', async ({ page }) => {
  await page.addInitScript(() => {
    const seen: string[] = [];
    (window as unknown as { seen: string[] }).seen = seen;
    document.addEventListener('animationstart', (e) => { seen.push(e.animationName); }, true);
  });
  await page.goto('/en/blog/');
  await page.locator('main a[href*="/blog/"]').first().click();
  await expect(page.locator('.post h1')).toBeVisible();
  await expect.poll(() => page.evaluate(() => (window as unknown as { seen: string[] }).seen)).toEqual(expect.arrayContaining(['page-rise', 'page-sink']));
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

  // issue #340, #376, #489: the pixel cursor snaps to the preview's arrow button from anywhere in the picture; the
  // button holds still and the frame grows with it, frame for frame
  test('the cursor snaps to the preview arrow button, which holds still while the frame rings it', async ({ page }) => {
    await page.goto('/en/');
    await ready(page);
    const arrow = page.locator('#work .project .media-arrow').first();
    await expect(arrow).toHaveAttribute('data-snap', '');
    await arrow.scrollIntoViewIfNeeded();
    const rest = await arrow.boundingBox();
    if (!rest) throw new Error('no arrow box');
    // far from the button, low in the picture: the pointer is well below it
    const media = await page.locator('#work .project .media').first().boundingBox();
    if (!media) throw new Error('no media box');
    await page.mouse.move(media.x + media.width / 2, media.y + media.height / 2);
    await page.mouse.move(media.x + media.width / 3, media.y + media.height * 0.9, { steps: 4 });
    const dot = page.locator('.pixel-cursor');
    // the frame is centred on the button and 8px larger, with no transition trailing the pill's growth
    const fit = async () => {
      const b = await arrow.boundingBox();
      const d = await dot.boundingBox();
      if (!b || !d) throw new Error('no box');
      const off = Math.hypot(d.x + d.width / 2 - (b.x + b.width / 2), d.y + d.height / 2 - (b.y + b.height / 2));
      return Math.max(off, Math.abs(d.width - b.width - 8), Math.abs(d.height - b.height - 8));
    };
    await expect.poll(fit).toBeLessThan(3);
    // the pill grows to the left from a right edge and a top that never move
    const now = await arrow.boundingBox();
    if (!now) throw new Error('no arrow box');
    expect(Math.abs(now.y - rest.y)).toBeLessThan(0.5);
    expect(Math.abs(now.x + now.width - (rest.x + rest.width))).toBeLessThan(0.5);
    expect(await dot.evaluate((el) => getComputedStyle(el).transitionProperty)).toBe('background-color');
    // the frame is the only cursor: the system pointer hides over the picture, and comes back off it (issue #523)
    const pointer = () => page.locator('#work .project .media').first().evaluate((el) => getComputedStyle(el).cursor);
    expect(await pointer()).toBe('none');
    await page.mouse.move(media.x - 40, media.y - 40);
    await expect.poll(pointer).toBe('pointer');
  });

  // issue #534: scrolled under the header, the button is hidden, and the frame lets go of it instead of ringing it
  // on top of the header
  test('the frame lets go of a preview button the header covers', async ({ page }) => {
    await page.goto('/en/');
    await ready(page);
    const media = page.locator('#work .project .media').first();
    const header = await page.locator('app-site-header').boundingBox();
    if (!header) throw new Error('no header box');
    // the picture's top 40px under the header
    await media.evaluate((el, top) => { scrollBy(0, el.getBoundingClientRect().top - top); }, header.y + header.height + 40);
    const box = await media.boundingBox();
    if (!box) throw new Error('no media box');
    const dot = page.locator('.pixel-cursor');
    const x = box.x + box.width / 3;
    const y = box.y + box.height * 0.6;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.move(x, y, { steps: 4 });
    await expect.poll(async () => (await dot.boundingBox())?.width ?? 0).toBeGreaterThan(40);
    // the button's top goes 20px under the header while the pointer stays on the picture
    const arrow = await page.locator('#work .project .media-arrow').first().boundingBox();
    if (!arrow) throw new Error('no arrow box');
    await page.evaluate((dy) => { scrollBy(0, dy); }, arrow.y - (header.y + header.height) + 20);
    // it is the pointer's frame again, under the pointer and clear of the header
    await expect.poll(async () => {
      const d = await dot.boundingBox();
      if (!d) return Infinity;
      return Math.hypot(d.x + d.width / 2 - x, d.y + d.height / 2 - y);
    }).toBeLessThan(3);
  });

  // inside the frame the screenshot drifts against the mouse, and settles back when it leaves (issue #523)
  test('the project picture drifts against the mouse while it is inside', async ({ page }) => {
    await page.goto('/en/');
    await ready(page);
    const frame = page.locator('#work .project .media').first();
    await frame.scrollIntoViewIfNeeded();
    const box = await frame.boundingBox();
    if (!box) throw new Error('no media box');
    const drift = async () => {
      const [x = 0, y = 0] = (await frame.locator('.shot').evaluate((el) => getComputedStyle(el).translate)).split(' ').map(parseFloat);
      return { x, y };
    };
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    // right of and above the centre: the picture moves left and down
    await page.mouse.move(box.x + box.width * 0.9, box.y + box.height * 0.1, { steps: 4 });
    await expect.poll(async () => { const d = await drift(); return d.x < -4 && d.y > 4; }).toBe(true);
    await page.mouse.move(box.x - 40, box.y - 40);
    await expect.poll(async () => { const d = await drift(); return Math.abs(d.x) + Math.abs(d.y) < 0.5; }).toBe(true);
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
