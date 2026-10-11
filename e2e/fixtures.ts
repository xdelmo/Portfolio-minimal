import { test as base } from '@playwright/test';

export { expect, type Locator, type Page } from '@playwright/test';

const WEBKIT_INTERNAL_ERROR = 'WebKit encountered an internal error';

/** Runs `navigate`, once more if WebKit dropped it with its internal error (issue #125); any other error is thrown. */
export async function retryWebkitInternalError<T>(navigate: () => Promise<T>, onRetry: () => void): Promise<T> {
  try {
    return await navigate();
  } catch (error) {
    if (!String(error).includes(WEBKIT_INTERNAL_ERROR)) throw error;
    onRetry();
    return navigate();
  }
}

/**
 * Every test starts as a returning visitor, so the intro overlay (shown once per session) does not cover the page.
 * Tests about the intro opt back in with `test.use({ intro: true })`.
 *
 * Smooth scroll (GSAP ScrollSmoother on desktop, issue #159) is off too: it moves the content after the scroll, and
 * tests that scroll and measure at once would read where it was gliding from. Tests about it opt in with
 * `test.use({ smoothScroll: true })`.
 *
 * The 3D avatar (issue #175) keeps its still image too: where WebGL has no GPU (CI, headless) and workers share the CPU,
 * each of its frames made a key press or a bounding box wait up to a second, and sequences of them timed out (issue
 * #184). Tests about it opt in with `test.use({ avatar: true })`.
 *
 * Every `page.goto` also waits until the motion effects have started (no `[data-motion="pending"]` left): they start
 * one task at a time after the first paint, and the pins they create make the page taller, so a test that scrolled
 * before them found its target pushed out of view (issue #86). Without JavaScript the hosts stay pending and nothing is
 * awaited; a test about that moment opts out with `test.use({ motionReady: false })`.
 *
 * A navigation WebKit drops with "WebKit encountered an internal error" is tried once more (issue #125): its web
 * process died under the memory of the Mac's OrbStack VM, never in CI nor on the Linux PC, even with four workers. Any
 * other error fails as before, and every retry leaves a `webkit-internal-error` annotation in the report.
 */
export const test = base.extend<{ intro: boolean; motionReady: boolean; smoothScroll: boolean; avatar: boolean }>({
  avatar: [false, { option: true }],
  intro: [false, { option: true }],
  smoothScroll: [false, { option: true }],
  motionReady: [true, { option: true }],
  page: async ({ page, intro, motionReady, smoothScroll, avatar, javaScriptEnabled }, use, testInfo) => {
    if (!avatar) {
      await page.addInitScript(() => {
        sessionStorage.setItem('avatar', 'still');
      });
    }
    if (!smoothScroll) {
      await page.addInitScript(() => {
        sessionStorage.setItem('smooth-scroll', 'off');
      });
    }
    if (!intro) {
      await page.addInitScript(() => {
        sessionStorage.setItem('intro', '1');
      });
    }
    const goto = page.goto.bind(page);
    page.goto = async (url, options) => {
      const response = await retryWebkitInternalError(
        () => goto(url, options),
        () => {
          testInfo.annotations.push({ type: 'webkit-internal-error', description: url });
        },
      );
      if (motionReady && javaScriptEnabled) {
        await page.waitForFunction(() => !document.querySelector('[data-motion="pending"]'), undefined, { timeout: 15_000 });
      }
      return response;
    };
    await use(page);
  },
});
