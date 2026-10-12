import { expect, test, type Page } from './fixtures';

// issue #129: on phones a button in the corner takes long pages back up
test('on phones a back-to-top button shows after a screen and a half and goes back up', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phones');
  await page.goto('/en/');
  const button = page.getByRole('button', { name: 'Back to top' });
  await expect(button).toHaveCount(0);
  await page.evaluate(() => {
    window.scrollTo(0, innerHeight * 3);
  });
  await expect(button).toBeVisible();
  await button.click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.locator('main')).toBeFocused();
  await expect(button).toHaveCount(0);
});

test('on desktop there is no back-to-top button in the corner', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop');
  await page.goto('/en/');
  await page.evaluate(() => {
    window.scrollTo(0, innerHeight * 3);
  });
  await expect(page.locator('app-back-to-top button')).toBeHidden();
});

// issue #197: it steps in and out instead of popping. Checked by the animations the button runs on its way out, not by
// timing it: WebKit's frames in CI are too slow for a time window
const animatesOut = async (page: Page): Promise<boolean> => {
  await page.evaluate(() => {
    window.scrollTo(0, innerHeight * 3);
  });
  await expect(page.locator('app-back-to-top button')).toHaveCount(1);
  return page.evaluate(
    () =>
      new Promise<boolean>((resolve) => {
        const host = document.querySelector('app-back-to-top');
        let animated = false;
        const watch = new MutationObserver(() => {
          const button = host?.querySelector('button');
          if (button?.classList.contains('is-leaving') && button.getAnimations().length > 0) animated = true;
          if (!button) {
            watch.disconnect();
            resolve(animated);
          }
        });
        if (host) watch.observe(host, { childList: true, subtree: true, attributes: true });
        window.scrollTo(0, 0);
      }),
  );
};

test('on phones the button rises in, and sinks out before it goes', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phones');
  await page.goto('/en/');
  expect(await animatesOut(page)).toBe(true);
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('on phones the button simply goes', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'phones');
    await page.goto('/en/');
    expect(await animatesOut(page)).toBe(false);
  });
});
