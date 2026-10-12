import { expect, test, type Page } from './fixtures';
import { DRAWS_MS, countFieldDraws, fieldDraws } from './field-draws';

const pause = (page: Page) => page.getByRole('button', { name: 'Pause animations' });
const field = (page: Page) => page.locator('app-pixel-field canvas');
const snapshot = (page: Page) => field(page).evaluate((c) => (c as HTMLCanvasElement).toDataURL());
// the canvas has its real size and first frame once the field has started (slower in WebKit)
const painted = (page: Page) => expect.poll(() => field(page).evaluate((c) => (c as HTMLCanvasElement).width !== 300)).toBe(true);

test('one header button pauses all automatic motion, from the keyboard too', async ({ page, isMobile }) => {
  test.skip(isMobile, 'on phones the controls are in the menu panel (menu.spec)');
  await countFieldDraws(page);
  await page.goto('/en/');
  await expect(page.getByRole('button', { name: 'Pause the pixel animation' })).toHaveCount(0);
  await expect(pause(page)).toHaveAttribute('aria-pressed', 'false');
  await painted(page);
  await pause(page).focus();
  await page.keyboard.press('Enter');
  await expect(pause(page)).toHaveAttribute('aria-pressed', 'true');
  // paused: the field stops drawing (one repaint on pausing, then nothing)
  const still = await snapshot(page);
  const pausedDraws = await fieldDraws(page);
  await page.waitForTimeout(400);
  expect(await snapshot(page)).toBe(still);
  expect(await fieldDraws(page)).toBe(pausedDraws);
  // resumed: its loop runs again (counted in frames, not pixels: issue #53)
  await page.keyboard.press('Enter');
  await expect(pause(page)).toHaveAttribute('aria-pressed', 'false');
  const resumed = await fieldDraws(page);
  await expect.poll(() => fieldDraws(page), { timeout: DRAWS_MS }).toBeGreaterThan(resumed + 2);
});

test('the pause lasts across pages for the whole visit', async ({ page, isMobile }) => {
  test.skip(isMobile, 'on phones the controls are in the menu panel (menu.spec)');
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
