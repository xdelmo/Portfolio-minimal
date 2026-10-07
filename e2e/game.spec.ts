import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from './fixtures';

const CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
const card = (page: Page) => page.getByRole('dialog', { name: 'Press start' });

async function typeCode(page: Page, keys: readonly string[] = CODE): Promise<void> {
  await page.locator('body').click({ position: { x: 4, y: 300 } });
  for (const key of keys) await page.keyboard.press(key);
}

test('the Konami code opens the player card, Escape closes it', async ({ page }) => {
  await page.goto('/en/');
  await typeCode(page);
  await expect(card(page)).toBeVisible();
  await expect(card(page).getByRole('listitem')).toHaveCount(4);
  await expect(card(page).getByRole('meter')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(card(page)).toBeHidden();
});

test('a wrong sequence opens nothing', async ({ page }) => {
  await page.goto('/en/');
  await typeCode(page, [...CODE.slice(0, 8), 'a', 'b']);
  await page.waitForTimeout(300);
  await expect(card(page)).toBeHidden();
});

test('the card speaks Italian on the Italian site', async ({ page }) => {
  await page.goto('/it/');
  await typeCode(page);
  await expect(page.getByRole('dialog')).toContainText('Obiettivi');
  await page.getByRole('button', { name: 'Continua' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('on a phone, five quick taps on the logo open it; one tap just goes home', async ({ page }) => {
  await page.goto('/en/work/apexflow');
  await page.locator('.logo').click();
  await expect(page).toHaveURL(/\/en\/$/);
  await expect(card(page)).toBeHidden();
  // taps count within 2 seconds: let that first one expire
  await page.waitForTimeout(2100);
  // quick taps by position, as a thumb does: locator clicks wait for the logo to be stable, about 0.5 s each in
  // WebKit on CI, so five of them could outlast the 2-second window
  const box = await page.locator('.logo').boundingBox();
  if (!box) throw new Error('the logo has no box');
  for (let i = 0; i < 5; i++) await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(card(page)).toBeVisible();
});

for (const theme of ['light', 'dark'] as const) {
  test(`the open card passes axe in the ${theme} theme`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.goto('/en/');
    await typeCode(page);
    await expect(card(page)).toBeVisible();
    await page.waitForTimeout(600);
    const results = await new AxeBuilder({ page }).include('dialog').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(results.violations).toEqual([]);
  });
}

// the hero answers the code with a level up (three rings from the face) and the card waits for it; where the face
// cannot be seen, or with reduced motion, nobody answers and the card opens at once
const listenForLeadIn = (page: Page) =>
  page.addInitScript(() => {
    document.addEventListener('game:start', (event) => {
      setTimeout(() => {
        Object.assign(window, { leadIn: event.defaultPrevented });
      });
    });
  });
const leadIn = (page: Page) => page.evaluate(() => (window as unknown as { leadIn?: boolean }).leadIn);

test('with the face on screen, the hero levels up before the card opens', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the code needs a keyboard');
  await listenForLeadIn(page);
  await page.goto('/en/');
  await typeCode(page);
  await expect(card(page)).toBeVisible();
  expect(await leadIn(page)).toBe(true);
});

test('away from the face, the card opens without a lead-in', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the code needs a keyboard');
  await listenForLeadIn(page);
  await page.goto('/en/');
  await page.locator('#contact').scrollIntoViewIfNeeded();
  await expect(page.locator('app-pixel-field canvas')).not.toBeInViewport();
  // a click by screen position: clicking the body locator would scroll back to the top
  await page.mouse.click(4, 300);
  for (const key of CODE) await page.keyboard.press(key);
  await expect(card(page)).toBeVisible();
  expect(await leadIn(page)).toBe(false);
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('the card opens without a lead-in', async ({ page, isMobile }) => {
    test.skip(isMobile, 'the code needs a keyboard');
    await listenForLeadIn(page);
    await page.goto('/en/');
    await typeCode(page);
    await expect(card(page)).toBeVisible();
    expect(await leadIn(page)).toBe(false);
  });
});
