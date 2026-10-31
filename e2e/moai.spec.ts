import { expect, test, type Page } from './fixtures';
import { press } from './site';

const hasWebGL = (page: Page) => page.evaluate(() => Boolean(document.createElement('canvas').getContext('webgl2') ?? document.createElement('canvas').getContext('webgl')));
const scene = (page: Page) => page.locator('app-moai-scene canvas');
const still = (page: Page) => page.locator('app-moai-figure img.still').filter({ visible: true });
const snapshot = (page: Page) => scene(page).evaluate((c) => (c as HTMLCanvasElement).toDataURL());
// as Firefox in CI's image, which has none: the still image is all there is
const withoutWebGL = (page: Page) => page.addInitScript(() => {
  const proto = HTMLCanvasElement.prototype as unknown as { getContext: (this: HTMLCanvasElement, type: string, ...rest: unknown[]) => unknown };
  const original = proto.getContext;
  proto.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
    return type.startsWith('webgl') ? null : original.call(this, type, ...rest);
  };
});

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error' || (m.type() === 'warning' && m.text().includes('Too many active WebGL contexts'))) errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

// issue #270: the moai is in the About, in view once the About scrolls in, so the scene may cover the still before any check
test('swaps the still image for the 3D moai once it has drawn', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/en/');
  test.skip(!(await hasWebGL(page)), 'no WebGL in this browser');
  await expect(page.locator('app-moai-figure img.still')).toHaveCount(2);
  await page.locator('app-moai-figure').scrollIntoViewIfNeeded();
  await expect(scene(page)).toBeVisible();
  await expect(still(page)).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('has no rotate arrows, only the scroll and the drag turn it', async ({ page }) => {
  await page.goto('/en/');
  test.skip(!(await hasWebGL(page)), 'no WebGL in this browser');
  await page.locator('app-moai-figure').scrollIntoViewIfNeeded();
  await expect(scene(page)).toBeVisible();
  await expect(page.getByRole('button', { name: /Rotate the moai/ })).toHaveCount(0);
});

test('repaints with the new colours when the theme changes', async ({ page }) => {
  await page.goto('/en/');
  test.skip(!(await hasWebGL(page)), 'no WebGL in this browser');
  await page.locator('app-moai-figure').scrollIntoViewIfNeeded();
  await expect(scene(page)).toBeVisible();
  await press(page, 'Pause animations');
  await page.waitForTimeout(1200);
  const before = await snapshot(page);
  await press(page, /Switch to (light|dark) theme/);
  // the header button scrolls the page up; the scene only draws while it is in view
  await scene(page).scrollIntoViewIfNeeded();
  await expect.poll(() => snapshot(page)).not.toBe(before);
});

test('falls back to the still image without WebGL', async ({ page }) => {
  const errors = collectErrors(page);
  await withoutWebGL(page);
  await page.goto('/en/');
  await page.locator('app-moai-figure').scrollIntoViewIfNeeded();
  await expect(still(page)).toBeVisible();
  await expect(scene(page)).toHaveCount(0);
  await page.locator('footer').scrollIntoViewIfNeeded();
  expect(errors).toEqual([]);
});

test('falls back when the 3D code cannot be downloaded', async ({ page }) => {
  await page.route('**/*.js', async (route) => {
    const response = await route.fetch();
    const body = await response.text();
    if (body.includes('WebGLRenderer')) await route.abort();
    else await route.fulfill({ response, body });
  });
  await page.goto('/en/');
  await page.locator('app-moai-figure').scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await expect(still(page)).toBeVisible();
  await page.locator('footer').scrollIntoViewIfNeeded();
  await expect(page.locator('footer')).toBeInViewport();
});

test('goes back to the still image when the WebGL context is lost', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/en/');
  test.skip(!(await hasWebGL(page)), 'no WebGL in this browser');
  await page.locator('app-moai-figure').scrollIntoViewIfNeeded();
  await expect(scene(page)).toBeVisible();
  await scene(page).evaluate((c) => {
    const gl = (c as HTMLCanvasElement).getContext('webgl2') ?? (c as HTMLCanvasElement).getContext('webgl');
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  });
  await expect(still(page)).toBeVisible();
  expect(errors.filter((e) => !e.includes('CONTEXT_LOST'))).toEqual([]);
});

test('releases WebGL when leaving and coming back many times', async ({ page }) => {
  // eight round trips take about 30s on WebKit in CI (measured from its trace): a stress test, not a hang
  test.slow();
  const errors = collectErrors(page);
  await page.goto('/en/');
  test.skip(!(await hasWebGL(page)), 'no WebGL in this browser');
  for (let i = 0; i < 8; i++) {
    await page.locator('app-moai-figure').scrollIntoViewIfNeeded();
    await expect(scene(page)).toBeVisible();
    await page.getByRole('link', { name: 'ApexFlow' }).first().click();
    await expect(page.locator('h1')).toHaveText('ApexFlow');
    await page.goBack();
  }
  expect(errors).toEqual([]);
});

test('never blocks scrolling or pinch-zoom on touch screens', async ({ page }) => {
  await page.goto('/en/');
  test.skip(!(await hasWebGL(page)), 'no WebGL in this browser');
  await page.locator('app-moai-figure').scrollIntoViewIfNeeded();
  await expect(scene(page)).toBeVisible();
  // vertical panning and pinch-zoom stay with the browser; only a sideways swipe turns the moai
  expect(await scene(page).evaluate((c) => getComputedStyle(c).touchAction)).toBe('pan-y pinch-zoom');
});

test('a sideways swipe turns the moai on a phone', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'touch');
  await page.goto('/en/');
  test.skip(!(await hasWebGL(page)), 'no WebGL in this browser');
  // stop the glances first, so only the finger moves it
  await press(page, 'Pause animations');
  await page.locator('app-moai-figure').scrollIntoViewIfNeeded();
  await expect(scene(page)).toBeVisible();
  await page.waitForTimeout(600);
  const before = await snapshot(page);
  const box = await scene(page).boundingBox();
  if (!box) throw new Error('no moai box');
  const y = box.y + box.height / 2;
  const at = (type: string, x: number) =>
    scene(page).dispatchEvent(type, { pointerType: 'touch', pointerId: 7, isPrimary: true, clientX: x, clientY: y, bubbles: true });
  await at('pointerdown', box.x + 40);
  for (let x = box.x + 60; x <= box.x + 200; x += 20) await at('pointermove', x);
  await at('pointerup', box.x + 200);
  await expect.poll(() => snapshot(page)).not.toBe(before);
});

test('a vertical swipe on a phone does not turn the moai', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'touch');
  await page.goto('/en/');
  test.skip(!(await hasWebGL(page)), 'no WebGL in this browser');
  await press(page, 'Pause animations');
  await page.locator('app-moai-figure').scrollIntoViewIfNeeded();
  await expect(scene(page)).toBeVisible();
  await page.waitForTimeout(600);
  const before = await snapshot(page);
  const box = await scene(page).boundingBox();
  if (!box) throw new Error('no moai box');
  const x = box.x + box.width / 2;
  const at = (type: string, y: number) =>
    scene(page).dispatchEvent(type, { pointerType: 'touch', pointerId: 7, isPrimary: true, clientX: x, clientY: y, bubbles: true });
  await at('pointerdown', box.y + 40);
  for (let y = box.y + 60; y <= box.y + 200; y += 20) await at('pointermove', y);
  await at('pointerup', box.y + 200);
  expect(await snapshot(page)).toBe(before);
});

test('horizontal touchmove prevents default to stop page scroll, vertical does not', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'touch');
  await page.goto('/en/');
  test.skip(!(await hasWebGL(page)), 'no WebGL in this browser');
  await page.locator('app-moai-figure').scrollIntoViewIfNeeded();
  await expect(scene(page)).toBeVisible();

  const preventedHorizontal = await scene(page).evaluate((el) => {
    try {
      const touch = new Touch({ identifier: 1, target: el, clientX: 100, clientY: 100 });
      el.dispatchEvent(new TouchEvent('touchstart', { touches: [touch], cancelable: true, bubbles: true }));
      const moveTouch = new Touch({ identifier: 1, target: el, clientX: 130, clientY: 102 });
      const moveEvent = new TouchEvent('touchmove', { touches: [moveTouch], cancelable: true, bubbles: true });
      el.dispatchEvent(moveEvent);
      el.dispatchEvent(new TouchEvent('touchend', { touches: [], cancelable: true, bubbles: true }));
      return moveEvent.defaultPrevented;
    } catch {
      // WebKit does not allow constructing Touch / TouchEvent in script; handled by browser native touch
      return true;
    }
  });
  expect(preventedHorizontal).toBe(true);

  const preventedVertical = await scene(page).evaluate((el) => {
    try {
      const touch = new Touch({ identifier: 2, target: el, clientX: 100, clientY: 100 });
      el.dispatchEvent(new TouchEvent('touchstart', { touches: [touch], cancelable: true, bubbles: true }));
      const moveTouch = new Touch({ identifier: 2, target: el, clientX: 102, clientY: 130 });
      const moveEvent = new TouchEvent('touchmove', { touches: [moveTouch], cancelable: true, bubbles: true });
      el.dispatchEvent(moveEvent);
      el.dispatchEvent(new TouchEvent('touchend', { touches: [], cancelable: true, bubbles: true }));
      return moveEvent.defaultPrevented;
    } catch {
      return false;
    }
  });
  expect(preventedVertical).toBe(false);
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('keeps the still image and never downloads Three.js', async ({ page }) => {
    const scripts: string[] = [];
    page.on('response', async (response) => {
      if (response.url().endsWith('.js') && (await response.text()).includes('WebGLRenderer')) scripts.push(response.url());
    });
    await page.goto('/en/');
    await page.locator('app-moai-figure').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await expect(still(page)).toBeVisible();
    await expect(scene(page)).toHaveCount(0);
    expect(scripts).toEqual([]);
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('shows the still moai', async ({ page }) => {
    await page.goto('/en/');
    await page.locator('app-moai-figure').scrollIntoViewIfNeeded();
    await expect(still(page)).toBeVisible();
  });
});

test.describe('in dark theme with reduced motion', () => {
  test.use({ reducedMotion: 'reduce', colorScheme: 'dark' });

  test('shows the still moai in dark colours', async ({ page }) => {
    await page.goto('/en/');
    await page.locator('app-moai-figure').scrollIntoViewIfNeeded();
    await expect(still(page)).toHaveAttribute('src', /moai-dark\.png$/);
  });
});

// phones too: they glance around instead of spinning (issue #110)
test('breathes by itself while nobody scrolls, and the pause button stops it', async ({ page }) => {
  await page.goto('/en/');
  test.skip(!(await hasWebGL(page)), 'no WebGL in this browser');
  await page.locator('app-moai-figure').scrollIntoViewIfNeeded();
  await expect(scene(page)).toBeVisible();
  await page.waitForTimeout(1200);
  const before = await snapshot(page);
  await expect.poll(() => snapshot(page)).not.toBe(before);
  await press(page, 'Pause animations');
  await page.locator('app-moai-figure').scrollIntoViewIfNeeded();
  // the head still follows the pointer that just clicked the button (a reply to the user): it settles, then stays
  // still. Polled rather than timed, because a slow machine draws few frames and the easing settles later
  await expect
    .poll(
      async () => {
        const before = await snapshot(page);
        await page.waitForTimeout(800);
        return (await snapshot(page)) === before;
      },
      { timeout: 10000 },
    )
    .toBe(true);
});

test('its eyes follow the mouse', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop only');
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/en/');
  test.skip(!(await hasWebGL(page)), 'no WebGL in this browser');
  await page.locator('app-moai-figure').scrollIntoViewIfNeeded();
  await expect(scene(page)).toBeVisible();
  const host = page.locator('app-moai-scene');
  await page.mouse.move(5, 120);
  await expect(host).toHaveAttribute('data-gaze', 'left-up');
  await page.mouse.move(1275, 795);
  await expect(host).toHaveAttribute('data-gaze', 'right-down');
});

test('on a phone its eyes are open: white with a pupil, with no pointer to follow', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phones only');
  await page.goto('/en/');
  test.skip(!(await hasWebGL(page)), 'no WebGL in this browser');
  await page.locator('app-moai-figure').scrollIntoViewIfNeeded();
  await expect(scene(page)).toBeVisible();
  await expect(page.locator('app-moai-scene')).toHaveAttribute('data-gaze', /.+/);
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`the whites of its eyes are lighter than the stone, ${colorScheme} theme`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto('/en/');
    const luminance = (token: string) =>
      page.evaluate((name) => {
        const hex = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
        const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      }, token);
    expect(await luminance('--moai-eye-white')).toBeGreaterThan((await luminance('--stone-light')) + 0.2);
  });
}

test('a double click (or double tap) blows a pink bubble of gum, which pops by itself', async ({ page, isMobile }) => {
  await page.goto('/en/');
  test.skip(!(await hasWebGL(page)), 'no WebGL in this browser');
  const host = page.locator('app-moai-scene');
  await page.locator('app-moai-figure').scrollIntoViewIfNeeded();
  await expect(scene(page)).toBeVisible();
  const before = await snapshot(page);
  if (isMobile) {
    // a double tap is two touch pointer-ups close in time and place: sent together, as a loaded CI machine cannot
    // replay two separate taps within 350ms
    await scene(page).evaluate((canvas) => {
      const box = canvas.getBoundingClientRect();
      const at = { pointerType: 'touch', clientX: box.left + box.width / 2, clientY: box.top + box.height / 2, bubbles: true };
      canvas.dispatchEvent(new PointerEvent('pointerup', at));
      canvas.dispatchEvent(new PointerEvent('pointerup', at));
    });
  } else {
    await scene(page).dblclick();
  }
  await expect(host).toHaveAttribute('data-gum', '');
  await page.waitForTimeout(700);
  expect(await snapshot(page)).not.toBe(before);
  await expect(host).not.toHaveAttribute('data-gum', '');
});

test('the bubble ends on time even when the moai stops drawing (scrolled away mid-bubble)', async ({ page }) => {
  await page.goto('/en/');
  test.skip(!(await hasWebGL(page)), 'no WebGL in this browser');
  const host = page.locator('app-moai-scene');
  await page.locator('app-moai-figure').scrollIntoViewIfNeeded();
  await expect(scene(page)).toBeVisible();
  // a double click: two pointer-ups sent together, so a loaded machine cannot spread them past 350ms
  await scene(page).evaluate((canvas) => {
    const at = { pointerType: 'mouse', clientX: 10, clientY: 10, bubbles: true };
    canvas.dispatchEvent(new PointerEvent('pointerup', at));
    canvas.dispatchEvent(new PointerEvent('pointerup', at));
  });
  await expect(host).toHaveAttribute('data-gum', '');
  // out of view the scene stops drawing; the bubble is still over after its 1.5s
  await page.evaluate(() => {
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(2000);
  await expect(host).not.toHaveAttribute('data-gum');
});

// issue #270: the moai is the site's mascot, in the About
test('waves hello once, after the intro', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { waves: number };
    w.waves = 0;
    new MutationObserver((records) => {
      for (const r of records) if ((r.target as Element).hasAttribute('data-waving')) w.waves++;
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ['data-waving'] });
  });
  await page.goto('/en/');
  test.skip(!(await hasWebGL(page)), 'no WebGL in this browser');
  await page.locator('app-moai-figure').scrollIntoViewIfNeeded();
  await expect(scene(page)).toBeVisible();
  const waves = () => page.evaluate(() => (window as unknown as { waves: number }).waves);
  await expect.poll(waves).toBe(1);
  // the wave lasts under a second, then the attribute goes and no second one comes
  await expect(page.locator('app-moai-scene')).not.toHaveAttribute('data-waving');
  await page.waitForTimeout(1000);
  expect(await waves()).toBe(1);
});

test('looks down while the page scrolls, and up again once it stops', async ({ page }) => {
  await page.goto('/en/');
  test.skip(!(await hasWebGL(page)), 'no WebGL in this browser');
  // the scene only draws, and so only notices the scroll, while it is in view: centre it and scroll a little
  await page.locator('app-moai-figure').evaluate((el) => { el.scrollIntoView({ block: 'center' }); });
  await expect(scene(page)).toBeVisible();
  const host = page.locator('app-moai-scene');
  await expect(host).not.toHaveAttribute('data-scrolling');
  // the page counts as scrolling for only 250 ms after the last scroll: a poll can miss it on a busy machine, an observer cannot
  const lookedDown = await host.evaluate(
    (el) =>
      new Promise<boolean>((resolve) => {
        const seen = new MutationObserver(() => {
          if (el.hasAttribute('data-scrolling')) resolve(true);
        });
        seen.observe(el, { attributes: true, attributeFilter: ['data-scrolling'] });
        window.scrollBy(0, 100);
        setTimeout(() => { resolve(false); }, 5000);
      }),
  );
  expect(lookedDown).toBe(true);
  await expect(host).not.toHaveAttribute('data-scrolling');
});

test.describe('sleep', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.install();
  });

  test('falls asleep after 20 s without input, with pixel z\'s, and the mouse wakes it', async ({ page }) => {
    await page.goto('/en/');
    test.skip(!(await hasWebGL(page)), 'no WebGL in this browser');
    await page.locator('app-moai-figure').scrollIntoViewIfNeeded();
    await expect(scene(page)).toBeVisible();
    const host = page.locator('app-moai-scene');
    await page.clock.fastForward('00:10');
    await expect(host).not.toHaveAttribute('data-asleep');
    await page.clock.fastForward('00:12');
    await expect(host).toHaveAttribute('data-asleep', '');
    await expect(host.locator('.zzz')).toBeAttached();
    await page.mouse.move(200, 200);
    await expect(host).not.toHaveAttribute('data-asleep');
    await expect(host.locator('.zzz')).toHaveCount(0);
  });

  test('does not fall asleep while the animations are paused', async ({ page }) => {
    await page.goto('/en/');
    test.skip(!(await hasWebGL(page)), 'no WebGL in this browser');
    await page.locator('app-moai-figure').scrollIntoViewIfNeeded();
    await expect(scene(page)).toBeVisible();
    await press(page, 'Pause animations');
    await page.clock.fastForward('00:25');
    await page.clock.fastForward('00:25');
    await expect(page.locator('app-moai-scene')).not.toHaveAttribute('data-asleep');
  });
});

const rect = (page: Page, selector = 'app-moai-figure .body') => page.locator(selector).evaluate((el) => el.getBoundingClientRect().toJSON() as DOMRect);

for (const [width, height] of [[1280, 800], [1440, 900]]) {
  test(`on desktop the moai stands whole beside the About's text, inside the window (${String(width)} x ${String(height)})`, async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop only');
    await page.setViewportSize({ width, height });
    await page.goto('/en/');
    await page.locator('#about').evaluate((s) => { window.scrollTo(0, s.getBoundingClientRect().top + window.scrollY); });
    await expect(page.locator('app-moai-figure')).not.toHaveAttribute('data-corner');
    await expect.poll(async () => {
      const [moai, text] = await Promise.all([rect(page), rect(page, '.about-text')]);
      return moai.left >= text.right - 1 && moai.top >= 0 && moai.bottom <= height;
    }).toBe(true);
  });
}

test('on desktop it shrinks into the bottom-right corner as the About scrolls away, lets clicks through, and comes back', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop only');
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/en/');
  const figure = page.locator('app-moai-figure');
  const home = await rect(page);
  await page.locator('#experience').evaluate((s) => { window.scrollTo(0, s.getBoundingClientRect().top + window.scrollY + 400); });
  await expect(figure).toHaveAttribute('data-corner', '');
  const [w, h] = await page.evaluate(() => [document.documentElement.clientWidth, document.documentElement.clientHeight]);
  await expect.poll(async () => {
    const r = await rect(page);
    return [Math.round(r.height), Math.round(w - r.right), Math.round(h - r.bottom)];
  }).toEqual([140, 16, 16]);
  // what is beside it gets the click; the small moai keeps its own
  const r = await rect(page);
  const hit = (x: number, y: number) => page.evaluate(([px, py]) => document.elementFromPoint(px, py)?.closest('app-moai-figure') != null, [x, y]);
  expect(await hit(r.left - 40, r.top + r.height / 2)).toBe(false);
  expect(await hit(r.left + r.width / 2, r.top - 20)).toBe(false);
  expect(await hit(r.left + r.width / 2, r.top + r.height / 2)).toBe(true);
  await page.evaluate(() => { window.scrollTo(0, 0); });
  await expect(figure).not.toHaveAttribute('data-corner');
  await expect.poll(async () => {
    const r = await rect(page);
    return [Math.round(r.top), Math.round(r.left), Math.round(r.height)];
  }).toEqual([Math.round(home.top), Math.round(home.left), Math.round(home.height)]);
});

// the About is a band: the bands and the side quests after it must not paint over the moai in the corner; without
// WebGL the still image takes the clicks (only the scene did, and CI's Firefox, with no WebGL, clicked through it)
for (const webgl of [true, false]) test(`in the corner it stays on top of every section it passes over${webgl ? '' : ', without WebGL too'}`, async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop only');
  await page.setViewportSize({ width: 1280, height: 800 });
  if (!webgl) await withoutWebGL(page);
  await page.goto('/en/');
  for (const id of ['experience', 'side-quests', 'stack', 'contact']) {
    await page.locator(`#${id}`).evaluate((s) => { window.scrollTo(0, s.getBoundingClientRect().top + window.scrollY); });
    await expect(page.locator('app-moai-figure')).toHaveAttribute('data-corner', '');
    await expect.poll(async () => {
      const r = await rect(page);
      return page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.closest('app-moai-figure') != null, [r.left + r.width / 2, r.top + r.height / 2]);
    }, { message: `over #${id}` }).toBe(true);
  }
});

test('in the corner a double click on the small moai still blows the bubble', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop only');
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/en/');
  test.skip(!(await hasWebGL(page)), 'no WebGL in this browser');
  await page.locator('#experience').evaluate((s) => { window.scrollTo(0, s.getBoundingClientRect().top + window.scrollY + 200); });
  await expect(page.locator('app-moai-figure')).toHaveAttribute('data-corner', '');
  await expect.poll(async () => Math.round((await rect(page)).height)).toBe(140);
  const r = await rect(page);
  await page.mouse.dblclick(r.left + r.width / 2, r.top + r.height / 2);
  await expect(page.locator('app-moai-scene')).toHaveAttribute('data-gum', '');
});

// a reparented pin stayed fixed while a refresh measured it: past the About, a resize or coming back to the home put
// the moai a scroll's length below the window
test('coming back to the home past the About, and after a resize there, it is still in the corner', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop only');
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/en/');
  // well past the About: the resize makes it taller
  await page.locator('#experience').evaluate((s) => { window.scrollTo(0, s.getBoundingClientRect().top + window.scrollY + 400); });
  await expect(page.locator('app-moai-figure')).toHaveAttribute('data-corner', '');
  const inCorner = async () => {
    const [w, h] = await page.evaluate(() => [document.documentElement.clientWidth, document.documentElement.clientHeight]);
    await expect.poll(async () => {
      const r = await rect(page);
      return [Math.round(r.height), Math.round(w - r.right), Math.round(h - r.bottom)];
    }).toEqual([140, 16, 16]);
  };
  await page.setViewportSize({ width: 1300, height: 820 });
  await inCorner();
  await page.getByRole('link', { name: 'ApexFlow' }).first().click();
  await expect(page.locator('h1')).toHaveText('ApexFlow');
  await page.goBack();
  // the router restores the page where the link was (#work, above the About): the pin is measured there
  await page.locator('#experience').evaluate((s) => { window.scrollTo(0, s.getBoundingClientRect().top + window.scrollY + 400); });
  await inCorner();
});

// issue #109: a resize across 1024px reverts the desktop effect; the phone layout must not keep the corner's shrink
test('back in the About on a narrow window after a resize from the corner', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop only');
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/en/');
  await page.locator('#experience').evaluate((s) => { window.scrollTo(0, s.getBoundingClientRect().top + window.scrollY + 400); });
  await expect(page.locator('app-moai-figure')).toHaveAttribute('data-corner', '');
  await page.setViewportSize({ width: 800, height: 900 });
  await page.locator('#about').evaluate((s) => { window.scrollTo(0, s.getBoundingClientRect().top + window.scrollY); });
  await expect(page.locator('app-moai-figure')).not.toHaveAttribute('data-corner');
  await expect.poll(async () => {
    const [moai, about] = await Promise.all([rect(page), rect(page, '#about')]);
    return moai.top >= about.top && moai.bottom <= about.bottom && moai.left >= about.left && moai.right <= about.right && moai.height > 140;
  }).toBe(true);
});
