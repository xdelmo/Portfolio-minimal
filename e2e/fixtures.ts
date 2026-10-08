import { test as base } from '@playwright/test';

export { expect, type Locator, type Page } from '@playwright/test';

/**
 * Every test starts as a returning visitor, so the intro overlay (shown once per session) does not cover the page.
 * Tests about the intro opt back in with `test.use({ intro: true })`.
 *
 * Every `page.goto` also waits until the motion effects have started (no `[data-motion="pending"]` left): they start
 * one task at a time after the first paint, and the pins they create make the page taller, so a test that scrolled
 * before them found its target pushed out of view (issue #86). Without JavaScript the hosts stay pending and nothing is
 * awaited; a test about that moment opts out with `test.use({ motionReady: false })`.
 */
export const test = base.extend<{ intro: boolean; motionReady: boolean }>({
  intro: [false, { option: true }],
  motionReady: [true, { option: true }],
  page: async ({ page, intro, motionReady, javaScriptEnabled }, use) => {
    if (!intro) {
      await page.addInitScript(() => {
        sessionStorage.setItem('intro', '1');
      });
    }
    if (motionReady && javaScriptEnabled) {
      const goto = page.goto.bind(page);
      page.goto = async (url, options) => {
        const response = await goto(url, options);
        await page.waitForFunction(() => !document.querySelector('[data-motion="pending"]'), undefined, { timeout: 15_000 });
        return response;
      };
    }
    await use(page);
  },
});
