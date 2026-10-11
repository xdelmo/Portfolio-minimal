import { expect, test, type Page } from './fixtures';

test.use({ avatar: true });

const hasWebGL = (page: Page) => page.evaluate(() => Boolean(document.createElement('canvas').getContext('webgl2')));
const layer = (page: Page) => page.locator('.avatar');
const drawn = (page: Page) => page.locator('.avatar[data-place][data-drawn]');
/** Three.js waits for a sign of the visitor (avatar-layer.ts): a move of the pointer. */
const wake = async (page: Page) => {
  await page.mouse.move(1, 1);
  await expect(drawn(page)).toHaveCount(1);
};
const still = (page: Page) => page.locator('.avatar-slot img').filter({ visible: true });
const snapshot = (page: Page) => page.locator('app-avatar-scene canvas').evaluate((c) => (c as HTMLCanvasElement).toDataURL());
/**
 * Scrolls and returns every state the layer went through on the way, recorded as it changes: reading it a frame or two
 * later misses the walk on WebKit in CI, where two frames outlast the 200 ms the walk lingers after the last scroll.
 */
const scrollAndRecord = (page: Page, to: string, offset = 0) =>
  page.evaluate(
    async ([selector, by]) => {
      const layer = document.querySelector<HTMLElement>('.avatar');
      const seen: Record<string, string>[] = [];
      const record = (): void => {
        seen.push(Object.fromEntries(Object.entries(layer?.dataset ?? {})));
      };
      const watcher = new MutationObserver(record);
      if (layer) watcher.observe(layer, { attributes: true, attributeFilter: ['data-gait', 'data-facing', 'data-place'] });
      const target = document.querySelector(selector);
      if (target) window.scrollTo(0, target.getBoundingClientRect().top + scrollY + by);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      watcher.disconnect();
      return seen;
    },
    [to, offset] as const,
  );

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

test('the 3D avatar takes the still image’s place in the hero', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/en/');
  test.skip(!(await hasWebGL(page)), 'no WebGL in this browser');
  await wake(page);
  await expect(layer(page)).toHaveAttribute('data-place', 'hero');
  await expect(layer(page)).toBeVisible();
  await expect(still(page)).toHaveCount(0);
  // it stands where the still image was
  const slot = await page.locator('.avatar-slot').boundingBox();
  const box = await layer(page).boundingBox();
  expect(Math.abs((box?.x ?? 0) + (box?.width ?? 0) / 2 - ((slot?.x ?? 0) + (slot?.width ?? 0) / 2))).toBeLessThan(2);
  expect(errors).toEqual([]);
});

// issue #184: at every animation frame it kept the main thread busy where WebGL has no GPU (a Tab took 400 ms)
test('it draws like a sprite, at most 12 frames a second, yet keeps moving', async ({ page }) => {
  await page.addInitScript(() => {
    const proto = WebGL2RenderingContext.prototype;
    const w = window as unknown as { avatarDraws: number };
    w.avatarDraws = 0;
    const original = Object.getOwnPropertyDescriptor(proto, 'clear')?.value as (this: WebGL2RenderingContext, mask: number) => void;
    proto.clear = function (this: WebGL2RenderingContext, mask: number) {
      if (this.canvas instanceof HTMLCanvasElement && this.canvas.closest('app-avatar-scene')) w.avatarDraws++;
      original.call(this, mask);
    };
  });
  await page.goto('/en/');
  test.skip(!(await hasWebGL(page)), 'no WebGL in this browser');
  await wake(page);
  const draws = await page.evaluate(async () => {
    const w = window as unknown as { avatarDraws: number };
    const from = w.avatarDraws;
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return w.avatarDraws - from;
  });
  expect(draws).toBeLessThanOrEqual(26);
  expect(draws).toBeGreaterThan(4);
});

test('scrolling, it shrinks onto the thread and walks down it with the lit line, then stands looking at the section', async ({ page, isMobile }) => {
  await page.goto('/en/');
  test.skip(!(await hasWebGL(page)), 'no WebGL in this browser');
  await wake(page);

  const going = await scrollAndRecord(page, '#about', -200);
  expect(going).toContainEqual(expect.objectContaining({ place: 'thread', gait: 'walk', facing: 'down' }));
  await expect(layer(page)).toHaveAttribute('data-gait', 'idle');
  await expect(layer(page)).toHaveAttribute('data-facing', 'right');

  const box = await layer(page).boundingBox();
  expect(box?.height).toBeCloseTo(isMobile ? 48 : 96, 0);
  // the soles on the tip of the lit line, the figure centred on the thread (pushed in from the edge on phones)
  const tip = await page.locator('app-thread .line').evaluate((el) => {
    const b = el.getBoundingClientRect();
    return { x: b.left + b.width / 2, y: b.bottom };
  });
  const feet = { x: (box?.x ?? 0) + (box?.width ?? 0) / 2, y: (box?.y ?? 0) + (box?.height ?? 0) * (1 - 0.15 / 1.3) };
  expect(Math.abs(feet.y - tip.y)).toBeLessThan(4);
  expect(Math.abs(feet.x - tip.x)).toBeLessThan(isMobile ? 12 : 2);

  const back = await scrollAndRecord(page, '#about', -600);
  expect(back).toContainEqual(expect.objectContaining({ gait: 'walk', facing: 'up' }));
});

test('it walks into the contact band at the end of the page', async ({ page }) => {
  await page.goto('/en/');
  test.skip(!(await hasWebGL(page)), 'no WebGL in this browser');
  await wake(page);
  await page.evaluate(() => {
    window.scrollTo(0, document.documentElement.scrollHeight);
  });
  // poll the place, not the gait: before the scroll event arrives the gait is still the hero's idle
  const inside = async () => {
    const contact = await page.locator('#contact').boundingBox();
    const box = await layer(page).boundingBox();
    if (!contact || !box) return false;
    return box.y > contact.y && box.y + box.height < contact.y + contact.height;
  };
  await expect.poll(inside).toBe(true);
  await expect(layer(page)).toHaveAttribute('data-gait', 'idle');
  expect(await inside()).toBe(true);
});

test('a tap plays a move, and the pause button stops its idle life', async ({ page }) => {
  test.slow();
  await page.goto('/en/');
  test.skip(!(await hasWebGL(page)), 'no WebGL in this browser');
  await wake(page);
  await page.getByRole('button', { name: 'Pause animations' }).click();
  // the header button may scroll the page: back to the hero, and let the turn settle
  await page.evaluate(() => {
    window.scrollTo(0, 0);
  });
  await expect(layer(page)).toHaveAttribute('data-place', 'hero');
  // paused, it comes to rest once its head has turned back from the pointer (about 2 s): two frames 600 ms apart are
  // the same. 15 s: reading a 2560px canvas back takes most of a second on WebKit in CI
  await expect
    .poll(
      async () => {
        const first = await snapshot(page);
        await page.waitForTimeout(600);
        return first === (await snapshot(page));
      },
      { timeout: 15_000 },
    )
    .toBe(true);
  const before = await snapshot(page);

  // a press that does not move is a tap; events on the canvas only, so the mouse never moves the head
  const canvas = page.locator('app-avatar-scene canvas');
  await canvas.dispatchEvent('pointerdown', { pointerId: 3, isPrimary: true, clientX: 10, clientY: 10, bubbles: true });
  await canvas.dispatchEvent('pointerup', { pointerId: 3, isPrimary: true, clientX: 10, clientY: 10, bubbles: true });
  await expect.poll(() => snapshot(page), { timeout: 15_000 }).not.toBe(before);
});

// fetched right after hydration, Three.js landed on Lighthouse's critical path (home 0.98 → 0.92)
test('waits for a sign of the visitor before downloading Three.js', async ({ page }) => {
  const scripts: string[] = [];
  page.on('response', async (response) => {
    if (response.url().endsWith('.js') && (await response.text()).includes('WebGLRenderer')) scripts.push(response.url());
  });
  await page.goto('/en/');
  await page.waitForTimeout(1000);
  expect(scripts).toEqual([]);
  await expect(still(page)).toBeVisible();
  await page.mouse.move(1, 1);
  await expect.poll(() => scripts.length).toBeGreaterThan(0);
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
  await page.mouse.move(1, 1);
  await page.waitForTimeout(1000);
  await expect(still(page)).toBeVisible();
  await expect(layer(page)).toBeHidden();
  expect(errors).toEqual([]);
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('keeps the still image in the hero and never downloads Three.js', async ({ page }) => {
    const scripts: string[] = [];
    page.on('response', async (response) => {
      if (response.url().endsWith('.js') && (await response.text()).includes('WebGLRenderer')) scripts.push(response.url());
    });
    await page.goto('/en/');
    await page.waitForTimeout(1000);
    await expect(still(page)).toBeVisible();
    await expect(page.locator('app-avatar-scene')).toHaveCount(0);
    expect(scripts).toEqual([]);
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('shows the still avatar in the hero', async ({ page }) => {
    await page.goto('/en/');
    await expect(still(page)).toBeVisible();
  });
});
