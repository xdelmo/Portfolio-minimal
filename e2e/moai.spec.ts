import { expect, test, type Page } from '@playwright/test';

const hasWebGL = (page: Page) => page.evaluate(() => Boolean(document.createElement('canvas').getContext('webgl2') ?? document.createElement('canvas').getContext('webgl')));
const scene = (page: Page) => page.locator('app-moai-scene canvas');
const still = (page: Page) => page.locator('app-moai-figure img.still');
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
  await expect(page.getByRole('button', { name: 'Rotate the moai right' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('the rotate buttons turn the moai, from the keyboard too', async ({ page }) => {
  await page.goto('/en/');
  test.skip(!(await hasWebGL(page)), 'no WebGL in this browser');
  await page.locator('#about').scrollIntoViewIfNeeded();
  const right = page.getByRole('button', { name: 'Rotate the moai right' });
  await expect(right).toBeVisible();
  const stop = page.getByRole('button', { name: 'Stop the moai' });
  if (await stop.isVisible()) await stop.click();
  await page.waitForTimeout(1200); // entry animation
  const before = await snapshot(page);
  await right.focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => snapshot(page)).not.toBe(before);
});

test('repaints with the new colours when the theme changes', async ({ page }) => {
  await page.goto('/en/');
  test.skip(!(await hasWebGL(page)), 'no WebGL in this browser');
  await page.locator('#about').scrollIntoViewIfNeeded();
  await expect(scene(page)).toBeVisible();
  const stop = page.getByRole('button', { name: 'Stop the moai' });
  if (await stop.isVisible()) await stop.click();
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
