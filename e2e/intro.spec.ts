import { expect, test } from './fixtures';

test.describe('intro', () => {
  test.use({ intro: true });
  // every test here is about the intro's own seconds: waiting for the motion effects took WebKit past its 3.6 s bound,
  // so a test read the lift, or the empty page after it, instead of the intro (#213)
  test.use({ motionReady: false });

  test('covers the first view, then lifts away by itself', async ({ page }) => {
    await page.goto('/en/');
    const intro = page.locator('.site-intro');
    await expect(intro).toBeVisible();
    await expect(intro).toHaveAttribute('aria-hidden', 'true');
    // at the latest the CSS lift ends 3.6s after the first render, which a slow machine pushes back
    await expect(intro).toBeHidden({ timeout: 6000 });
  });

  test('centres the pixel row under the name', async ({ page }) => {
    await page.goto('/en/');
    // the global measure on <p> once left the row narrower than the name, off the centre (issue #234)
    const offset = await page.evaluate(() => {
      const px = [...document.querySelectorAll('.site-intro .px')].map((el) => el.getBoundingClientRect());
      return (px[0].left + px[px.length - 1].right) / 2 - innerWidth / 2;
    });
    expect(Math.abs(offset)).toBeLessThan(1);
  });

  for (const colorScheme of ['light', 'dark'] as const) {
    test(`hides the page completely in the ${colorScheme} theme`, async ({ page }) => {
        await page.emulateMedia({ colorScheme });
      await page.goto('/en/');
      const background = await page.locator('.site-intro').evaluate((el) => getComputedStyle(el).backgroundColor);
      // rgb() is opaque; rgba() or "rgb(... / a)" would let the page show through
      expect(background).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
    });
  }

  test('never blocks a click', async ({ page }) => {
    await page.goto('/en/');
    await page.locator('app-site-header .cta').click();
    await expect(page).toHaveURL(/#contact$/);
  });

  test('is shown once per session', async ({ page }) => {
    await page.goto('/en/');
    await expect(page.locator('.site-intro')).toBeHidden({ timeout: 6000 });
    await page.goto('/en/work/apexflow');
    await expect(page.locator('.site-intro')).toBeHidden();
  });

  test('lifts away even if reduced motion is switched on while it plays', async ({ page }) => {
    await page.goto('/en/');
    await expect(page.locator('.site-intro')).toBeVisible();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(page.locator('.site-intro')).toBeHidden();
  });

  // a slow phone or a busy CI: the motion script arrives about 2.4s in, too late to replay the 2s intro without holding
  // the page past the CSS fallback, which then finishes the lift
  test('leaves the lift to the CSS when the motion script comes too late to replay it', async ({ page }) => {
    // only the chunk that carries GSAP comes late, whenever it is asked for
    await page.route('**/*.js', async (route) => {
      const response = await route.fetch();
      if ((await response.text()).includes('GreenSock')) await new Promise((resolve) => setTimeout(resolve, 2300));
      await route.fulfill({ response });
    });
    // GSAP takes over by switching the CSS lift off on the panel: watch for it from the first render
    await page.addInitScript(() => {
      new MutationObserver(() => {
        const panel = document.querySelector<HTMLElement>('.site-intro');
        if (panel?.style.animationName === 'none') Object.assign(window, { replayed: true });
      }).observe(document, { subtree: true, attributes: true, attributeFilter: ['style'] });
    });
    await page.goto('/en/');
    await page.waitForFunction(() => !document.documentElement.classList.contains('intro-on'), null, { timeout: 10000 });
    // too late to replay without holding the page past the CSS lift: the CSS finished it
    expect(await page.evaluate(() => 'replayed' in window)).toBe(false);
  });

  // GSAP missed the whole intro: the CSS lifted a dim panel, which does not count as seen (issue #404)
  test('plays again on the next load when the motion script came after the CSS lift', async ({ page }) => {
    await page.route('**/*.js', async (route) => {
      const response = await route.fetch();
      if ((await response.text()).includes('GreenSock')) await new Promise((resolve) => setTimeout(resolve, 8000));
      await route.fulfill({ response });
    });
    await page.goto('/en/');
    await page.waitForFunction(() => !document.documentElement.classList.contains('intro-on'), null, { timeout: 15000 });
    await page.unroute('**/*.js');
    await page.goto('/en/work/apexflow');
    await expect(page.locator('.site-intro')).toBeVisible();
  });

  // a slow network: GSAP arrives after the CSS lift, too late for heroEffect's entrance, so the CSS one shows the
  // hero copy coming in after the panel has gone instead of already in place (issue #329)
  test('raises the hero in after the CSS lift when the motion script comes after it', async ({ page }) => {
    await page.route('**/*.js', async (route) => {
      const response = await route.fetch();
      if ((await response.text()).includes('GreenSock')) await new Promise((resolve) => setTimeout(resolve, 8000));
      await route.fulfill({ response });
    });
    await page.goto('/en/');
    const copy = page.locator('.hero .copy');
    // under the panel the copy waits lowered (never transparent: it is the LCP, issue #381), so its entrance is
    // still to come when the panel has lifted
    await page.waitForFunction(
      () => {
        const panel = document.querySelector('.site-intro');
        return panel !== null && getComputedStyle(panel).visibility === 'hidden';
      },
      null,
      { timeout: 8000 },
    );
    expect(await copy.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
    expect(await copy.evaluate((el) => getComputedStyle(el).translate)).not.toBe('none');
    await expect(copy).toHaveCSS('translate', 'none');
  });

  // phones get the intro too (issue #381): the name wraps between its words and nothing runs off the screen
  test.describe('on a phone-sized screen', () => {
    test.use({ viewport: { width: 360, height: 740 } });
    test('appears, and the name fits the screen without breaking a word', async ({ page }) => {
      await page.goto('/en/');
      await expect(page.locator('.site-intro')).toBeVisible();
      const fit = await page.evaluate(() => {
        const words = [...document.querySelectorAll('.site-intro .word')].map((el) => el.getBoundingClientRect());
        const letterTops = [...document.querySelectorAll('.site-intro .word')].map((word) =>
          new Set([...word.querySelectorAll('.letter')].map((el) => Math.round(el.getBoundingClientRect().top))).size,
        );
        return {
          inside: words.every((r) => r.left >= 0 && r.right <= innerWidth),
          whole: letterTops.every((lines) => lines === 1),
          overflow: document.documentElement.scrollWidth - innerWidth,
        };
      });
      expect(fit).toEqual({ inside: true, whole: true, overflow: 0 });
      await expect(page.locator('.site-intro')).toBeHidden({ timeout: 6000 });
    });
  });

  test.describe('with reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });
    test('does not appear', async ({ page }) => {
      await page.goto('/en/');
      await expect(page.locator('.site-intro')).toBeHidden();
    });
  });

  test.describe('without JavaScript', () => {
    test.use({ javaScriptEnabled: false });
    test('does not appear', async ({ page }) => {
      await page.goto('/en/');
      await expect(page.locator('.site-intro')).toBeHidden();
    });
  });
});
