import { expect, test, type Page } from './fixtures';

declare global {
  interface Window {
    __audioContexts?: number;
    __audio?: AudioContext;
  }
}

const music = (page: Page) => page.locator('app-site-header .controls').getByRole('button', { name: 'Background music' });

// wraps AudioContext to track instances created and keep a reference to the latest one
const trackAudioContext = async (page: Page) => {
  await page.addInitScript(() => {
    window.__audioContexts = 0;
    const Original = window.AudioContext;
    window.AudioContext = class extends Original {
      constructor(options?: AudioContextOptions) {
        super(options);
        window.__audioContexts = (window.__audioContexts ?? 0) + 1;
        window.__audio = this;
      }
    };
  });
};

test('muted by default and no AudioContext created before click', async ({ page, isMobile }) => {
  test.skip(isMobile, 'on phones the controls are in the menu panel (menu.spec)');
  await trackAudioContext(page);
  await page.goto('/en/');
  expect(await page.evaluate(() => window.__audioContexts ?? 0)).toBe(0);
  await expect(music(page)).toHaveAttribute('aria-pressed', 'false');

  // first click loads the audio chunk, creates the context and starts playback
  await music(page).click();
  await expect(music(page)).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => page.evaluate(() => window.__audioContexts ?? 0)).toBe(1);
  await expect.poll(() => page.evaluate(() => window.__audio?.state)).toBe('running');

  // second click mutes the music
  await music(page).click();
  await expect(music(page)).toHaveAttribute('aria-pressed', 'false');
});

test('stays playing across internal SPA navigation and resets on reload', async ({ page, isMobile }) => {
  test.skip(isMobile, 'on phones the controls are in the menu panel (menu.spec)');
  await page.goto('/en/');
  await music(page).click();
  await expect(music(page)).toHaveAttribute('aria-pressed', 'true');

  // internal navigation keeps the sound playing
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Blog' }).click();
  await expect(page).toHaveURL(/\/en\/blog/);
  await expect(music(page)).toHaveAttribute('aria-pressed', 'true');

  // reload resets back to muted
  await page.reload();
  await expect(music(page)).toHaveAttribute('aria-pressed', 'false');
});

test('on phones the button lives in the menu panel', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phones');
  await page.goto('/en/');
  const header = page.locator('app-site-header');
  await expect(header.locator('.controls').getByRole('button', { name: 'Background music' })).toHaveCount(0);

  await header.locator('.site-menu summary').click();
  const button = header.locator('.site-menu .settings').getByRole('button', { name: 'Background music' });
  await expect(button).toBeVisible();
  await expect(button).toHaveAttribute('aria-pressed', 'false');
  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'true');
});
