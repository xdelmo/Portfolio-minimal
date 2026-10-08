import { expect, test, type Page } from './fixtures';

const hasWebGL = (page: Page) => page.evaluate(() => Boolean(document.createElement('canvas').getContext('webgl2') ?? document.createElement('canvas').getContext('webgl')));
const scene = (page: Page) => page.locator('app-moai-scene canvas');
const still = (page: Page) => page.locator('app-moai-figure img.still').filter({ visible: true });
const snapshot = (page: Page) => scene(page).evaluate((c) => (c as HTMLCanvasElement).toDataURL());

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error' || (m.type() === 'warning' && m.text().includes('Too many active WebGL contexts'))) errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

test('swaps the still image for the 3D moai once it is in view', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/en/');
  test.skip(!(await hasWebGL(page)), 'no WebGL in this browser');
  await expect(still(page)).toHaveCount(1);
  await page.locator('app-moai-figure').scrollIntoViewIfNeeded();
  await expect(scene(page)).toBeVisible();
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
  await page.getByRole('button', { name: 'Pause animations' }).click();
  await page.waitForTimeout(1200);
  const before = await snapshot(page);
  await page.getByRole('button', { name: /Switch to (light|dark) theme/ }).click();
  // the header button scrolls the page up; the scene only draws while it is in view
  await scene(page).scrollIntoViewIfNeeded();
  await expect.poll(() => snapshot(page)).not.toBe(before);
});

test('falls back to the still image without WebGL', async ({ page }) => {
  const errors = collectErrors(page);
  await page.addInitScript(() => {
    const proto = HTMLCanvasElement.prototype as unknown as { getContext: (this: HTMLCanvasElement, type: string, ...rest: unknown[]) => unknown };
    const original = proto.getContext;
    proto.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      return type.startsWith('webgl') ? null : original.call(this, type, ...rest);
    };
  });
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
  // stop the automatic spin first, so only the finger moves it
  await page.getByRole('button', { name: 'Pause animations' }).click();
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

test('stays pinned on desktop while the about text scrolls', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the pin is desktop only');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/en/');
  const top = async (offset: number): Promise<number | undefined> => {
    await page.locator('#about').evaluate((el, by) => {
      window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY + by);
    }, offset);
    await page.waitForTimeout(100);
    return (await page.locator('app-moai-figure').boundingBox())?.y;
  };
  const first = await top(150);
  const second = await top(250);
  expect(first).toBeDefined();
  expect(second).toBeCloseTo(first ?? Number.NaN, 0);
});

test.describe('in dark theme with reduced motion', () => {
  test.use({ reducedMotion: 'reduce', colorScheme: 'dark' });

  test('shows the still moai in dark colours', async ({ page }) => {
    await page.goto('/en/');
    await page.locator('app-moai-figure').scrollIntoViewIfNeeded();
    await expect(still(page)).toHaveAttribute('src', /moai-dark\.png$/);
  });
});

test('breathes by itself while nobody scrolls, and the pause button stops it', async ({ page, isMobile }) => {
  test.skip(isMobile, 'phones already spin it');
  await page.goto('/en/');
  test.skip(!(await hasWebGL(page)), 'no WebGL in this browser');
  await page.locator('app-moai-figure').scrollIntoViewIfNeeded();
  await expect(scene(page)).toBeVisible();
  await page.waitForTimeout(1200);
  const before = await snapshot(page);
  await expect.poll(() => snapshot(page), { timeout: 4000 }).not.toBe(before);
  await page.getByRole('button', { name: 'Pause animations' }).click();
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
  await expect(host).not.toHaveAttribute('data-gum', '', { timeout: 4000 });
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

test('stays whole at the end of its section on desktop: no burst into cubes (removed on request)', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the scroll drives the moai on desktop only');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/en/');
  test.skip(!(await hasWebGL(page)), 'no WebGL in this browser');
  await page.locator('app-moai-figure').scrollIntoViewIfNeeded();
  await expect(scene(page)).toBeVisible();
  // the width of the drawn moai: the columns that hold at least one opaque pixel
  const widthAt = async (progress: number): Promise<number> => {
    await page.locator('#about').evaluate((el, p) => {
      const top = el.getBoundingClientRect().top + window.scrollY;
      window.scrollTo(0, top - innerHeight / 2 + p * el.getBoundingClientRect().height);
    }, progress);
    await page.waitForTimeout(400);
    return scene(page).evaluate((c) => {
      const canvas = c as HTMLCanvasElement;
      const copy = document.createElement('canvas');
      copy.width = canvas.width;
      copy.height = canvas.height;
      const ctx = copy.getContext('2d');
      if (!ctx) return -1;
      ctx.drawImage(canvas, 0, 0);
      const { data } = ctx.getImageData(0, 0, copy.width, copy.height);
      let min = copy.width;
      let max = -1;
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] > 0) {
          const x = ((i - 3) / 4) % copy.width;
          min = Math.min(min, x);
          max = Math.max(max, x);
        }
      }
      return (max - min) / copy.width;
    });
  };
  // WebKit may hand back an empty WebGL buffer between frames (-1 = no opaque pixel): read until a frame is there,
  // or an empty end frame would pass the comparison by itself
  let middle = -1;
  await expect.poll(async () => (middle = await widthAt(0.5))).toBeGreaterThan(0);
  let end = -1;
  await expect.poll(async () => (end = await widthAt(0.97))).toBeGreaterThan(0);
  expect(end).toBeLessThan(middle * 1.25);
});

// desktop: the moai stays beside the text as it scrolls, fully below the sticky header, at least 400px tall
for (const height of [720, 900]) {
  test(`on desktop the moai pins below the header, whole, beside the text (${String(height)}px tall)`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height });
    await page.goto('/en/');
    await page.evaluate(() => {
      const about = document.querySelector('#about');
      if (about) scrollTo(0, about.getBoundingClientRect().top + scrollY + 300);
    });
    const [headerBottom, top, bottom] = await page.evaluate(() => {
      const moai = document.querySelector('app-moai-figure')?.getBoundingClientRect();
      return [document.querySelector('app-site-header header')?.getBoundingClientRect().bottom ?? 0, moai?.top ?? 0, moai?.bottom ?? 0];
    });
    expect(top).toBeGreaterThanOrEqual(headerBottom + 56);
    expect(bottom).toBeLessThanOrEqual(height - 56);
    expect(bottom - top).toBeGreaterThanOrEqual(400);
  });
}
