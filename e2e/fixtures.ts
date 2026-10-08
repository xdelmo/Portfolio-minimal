import { test as base } from '@playwright/test';

export { expect, type Locator, type Page } from '@playwright/test';

/**
 * Every test starts as a returning visitor, so the intro overlay (shown once per session) does not cover the page.
 * Tests about the intro opt back in with `test.use({ intro: true })`.
 */
export const test = base.extend<{ intro: boolean }>({
  intro: [false, { option: true }],
  page: async ({ page, intro }, use) => {
    if (!intro) {
      await page.addInitScript(() => {
        sessionStorage.setItem('intro', '1');
      });
    }
    await use(page);
  },
});
