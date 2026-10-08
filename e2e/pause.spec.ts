import { expect, test, type Page } from './fixtures';

const pause = (page: Page) => page.getByRole('button', { name: 'Pause animations' });
const field = (page: Page) => page.locator('app-pixel-field canvas');
const snapshot = (page: Page) => field(page).evaluate((c) => (c as HTMLCanvasElement).toDataURL());
// the canvas has its real size and first frame once the field has started (slower in WebKit)
const painted = (page: Page) => expect.poll(() => field(page).evaluate((c) => (c as HTMLCanvasElement).width !== 300)).toBe(true);

// Issue #53: once in CI the canvas did not change for 5 s after resuming, and it never fails locally. If it fails
// again, the error says whether animation frames ran and whether the page counted as hidden.
const countFrames = (page: Page) =>
  page.addInitScript(() => {
    const w = window as unknown as { frames53: number };
    w.frames53 = 0;
    const raf = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (cb) =>
      raf((t) => {
        w.frames53++;
        cb(t);
      });
  });
const frameState = (page: Page) =>
  page.evaluate(() => ({ frames: (window as unknown as { frames53: number }).frames53, hidden: document.hidden }));

test('one header button pauses all automatic motion, from the keyboard too', async ({ page }) => {
  await countFrames(page);
  await page.goto('/en/');
  await expect(page.getByRole('button', { name: 'Pause the pixel animation' })).toHaveCount(0);
  await expect(pause(page)).toHaveAttribute('aria-pressed', 'false');
  await painted(page);
  await pause(page).focus();
  await page.keyboard.press('Enter');
  await expect(pause(page)).toHaveAttribute('aria-pressed', 'true');
  const still = await snapshot(page);
  await page.waitForTimeout(400);
  expect(await snapshot(page)).toBe(still);
  await page.keyboard.press('Enter');
  await expect(pause(page)).toHaveAttribute('aria-pressed', 'false');
  const resumed = await frameState(page);
  try {
    await expect.poll(() => snapshot(page)).not.toBe(still);
  } catch (error) {
    const now = await frameState(page);
    throw new Error(
      `canvas unchanged after resuming: animation frames ${String(resumed.frames)} -> ${String(now.frames)}, document.hidden ${String(now.hidden)}`,
      { cause: error },
    );
  }
});

test('the pause lasts across pages for the whole visit', async ({ page }) => {
  await page.goto('/en/');
  await pause(page).click();
  await page.goto('/en/work/apexflow');
  await expect(pause(page)).toHaveAttribute('aria-pressed', 'true');
  await page.goto('/en/');
  await expect(pause(page)).toHaveAttribute('aria-pressed', 'true');
  await painted(page);
  await page.waitForTimeout(200);
  const still = await snapshot(page);
  await page.waitForTimeout(400);
  expect(await snapshot(page)).toBe(still);
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('there is nothing to pause, so there is no button', async ({ page }) => {
    await page.goto('/en/');
    await expect(page.locator('app-site-header')).toBeVisible();
    await expect(pause(page)).toHaveCount(0);
  });
});
