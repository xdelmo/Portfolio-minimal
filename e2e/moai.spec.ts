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
  await page.locator('#about').scrollIntoViewIfNeeded();
  await expect(scene(page)).toBeVisible();
  expect(errors).toEqual([]);
});

test('has no rotate arrows, only the scroll and the drag turn it', async ({ page }) => {
  await page.goto('/en/');
  test.skip(!(await hasWebGL(page)), 'no WebGL in this browser');
  await page.locator('#about').scrollIntoViewIfNeeded();
  await expect(scene(page)).toBeVisible();
  await expect(page.getByRole('button', { name: /Rotate the moai/ })).toHaveCount(0);
});

test('repaints with the new colours when the theme changes', async ({ page }) => {
  await page.goto('/en/');
  test.skip(!(await hasWebGL(page)), 'no WebGL in this browser');
  await page.locator('#about').scrollIntoViewIfNeeded();
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
  await page.locator('#about').scrollIntoViewIfNeeded();
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
  await page.locator('#about').scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await expect(still(page)).toBeVisible();
  await page.locator('footer').scrollIntoViewIfNeeded();
  await expect(page.locator('footer')).toBeInViewport();
});

test('goes back to the still image when the WebGL context is lost', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/en/');
  test.skip(!(await hasWebGL(page)), 'no WebGL in this browser');
  await page.locator('#about').scrollIntoViewIfNeeded();
  await expect(scene(page)).toBeVisible();
  await scene(page).evaluate((c) => {
    const gl = (c as HTMLCanvasElement).getContext('webgl2') ?? (c as HTMLCanvasElement).getContext('webgl');
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  });
  await expect(still(page)).toBeVisible();
  expect(errors.filter((e) => !e.includes('CONTEXT_LOST'))).toEqual([]);
});

test('releases WebGL when leaving and coming back many times', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/en/');
  test.skip(!(await hasWebGL(page)), 'no WebGL in this browser');
  for (let i = 0; i < 8; i++) {
    await page.locator('#about').scrollIntoViewIfNeeded();
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
  await page.locator('#about').scrollIntoViewIfNeeded();
  await expect(scene(page)).toBeVisible();
  expect(['', 'auto']).toContain(await scene(page).evaluate((c) => getComputedStyle(c).touchAction));
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('keeps the still image and never downloads Three.js', async ({ page }) => {
    const scripts: string[] = [];
    page.on('response', async (response) => {
      if (response.url().endsWith('.js') && (await response.text()).includes('WebGLRenderer')) scripts.push(response.url());
    });
    await page.goto('/en/');
    await page.locator('#about').scrollIntoViewIfNeeded();
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
    await page.locator('#about').scrollIntoViewIfNeeded();
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
  await page.locator('#about').scrollIntoViewIfNeeded();
  await expect(scene(page)).toBeVisible();
  await page.waitForTimeout(1200);
  const before = await snapshot(page);
  await expect.poll(() => snapshot(page), { timeout: 4000 }).not.toBe(before);
  await page.getByRole('button', { name: 'Pause animations' }).click();
  await page.locator('#about').scrollIntoViewIfNeeded();
  // the head still follows the pointer that just clicked the button (a reply to the user): let it settle
  await page.waitForTimeout(2500);
  const still = await snapshot(page);
  await page.waitForTimeout(800);
  expect(await snapshot(page)).toBe(still);
});
