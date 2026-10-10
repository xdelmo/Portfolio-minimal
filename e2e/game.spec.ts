import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from './fixtures';

const CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
// the code (and its taps on phones) unlocks the cheat version of the card; Press start opens the plain one
const card = (page: Page) => page.getByRole('dialog', { name: 'Cheat activated' });

async function typeCode(page: Page, keys: readonly string[] = CODE): Promise<void> {
  await page.locator('body').click({ position: { x: 4, y: 300 } });
  for (const key of keys) await page.keyboard.press(key);
}

test('the Konami code opens the player card, Escape closes it', async ({ page }) => {
  await page.goto('/en/');
  await typeCode(page);
  await expect(card(page)).toBeVisible();
  await expect(card(page).getByRole('listitem')).toHaveCount(5);
  await expect(card(page).getByRole('meter')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(card(page)).toBeHidden();
});

// issue #124: the cheat card levels up from the real level to 99 (counted by what the page shows, not by timing)
test('the cheat card levels up: from the real level to 99, through the steps in between', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the code needs a keyboard');
  await page.goto('/en/');
  await page.evaluate(() => {
    const seen: string[] = [];
    (window as unknown as { levels: string[] }).levels = seen;
    new MutationObserver(() => {
      const level = document.querySelector('app-player-card .level')?.textContent.trim();
      if (level && seen.at(-1) !== level) seen.push(level);
    }).observe(document.body, { subtree: true, childList: true, characterData: true });
  });
  await typeCode(page);
  await expect(card(page).locator('.level')).toHaveText('99');
  await expect(card(page).locator('meter')).toHaveAttribute('value', '1');
  await expect(card(page).getByText('Konami code')).toBeVisible();
  const levels = await page.evaluate(() => (window as unknown as { levels: string[] }).levels);
  expect(levels[0]).toBe('3');
  expect(levels.at(-1)).toBe('99');
  expect(levels.length).toBeGreaterThan(3);
  // the jumping pixels are gone once it is over
  await expect(page.locator('app-player-card .burst')).toHaveCount(0);
});

test('the combo row lights a cell for each right key from the third, and goes on a wrong one', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the code needs a keyboard');
  await page.goto('/en/');
  const combo = page.locator('app-game-trigger .combo');
  await typeCode(page, CODE.slice(0, 2));
  // ↑ ↑ alone is someone scrolling
  await expect(combo).toHaveCount(0);
  await page.keyboard.press(CODE[2]);
  await expect(combo.locator('.on')).toHaveCount(3);
  await page.keyboard.press(CODE[3]);
  await expect(combo.locator('.on')).toHaveCount(4);
  await page.keyboard.press('x');
  await expect(combo).toHaveCount(0);
});

test('the code unlocks the cheat card, Press start the plain one', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the code needs a keyboard');
  await page.goto('/en/');
  await typeCode(page);
  await expect(card(page)).toContainText('99');
  await expect(card(page)).toContainText('Konami code');
  await expect(card(page).locator('meter')).toHaveAttribute('value', '1');
  await page.keyboard.press('Escape');
  await page.locator('app-site-footer').getByRole('button', { name: 'Press start' }).click();
  const plain = page.getByRole('dialog', { name: 'Pause' });
  await expect(plain).toBeVisible();
  await expect(plain).not.toContainText('Konami code');
  await expect(plain.locator('dd').nth(2)).toHaveText('3');
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

  test('the cheat card opens maxed out, with no level up', async ({ page, isMobile }) => {
    test.skip(isMobile, 'the code needs a keyboard');
    await page.goto('/en/');
    await typeCode(page);
    // at once: read as soon as the card is there, not waited for
    expect(await card(page).locator('.level').textContent()).toBe('99');
    await expect(page.locator('app-player-card .burst')).toHaveCount(0);
  });
});
