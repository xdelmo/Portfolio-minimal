import { expect, test } from './fixtures';

test('follows the system theme on first visit, before the app boots', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/en/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('the toggle switches theme and the choice survives a reload', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/en/');
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('button', { name: 'Switch to light theme' })).toBeVisible();
});

test('the toggle label is translated', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/it/');
  await expect(page.getByRole('button', { name: 'Passa al tema scuro' })).toBeVisible();
});

// counts the view transitions the page starts, so a test can tell the reveal ran
const countTransitions = () => {
  const w = window as unknown as { transitions: number };
  w.transitions = 0;
  const original = document.startViewTransition.bind(document);
  document.startViewTransition = (update) => {
    w.transitions++;
    return original(update);
  };
};

test('switching theme sweeps a reveal across the whole viewport', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/en/');
  test.skip(!(await page.evaluate(() => 'startViewTransition' in document)), 'no View Transitions in this browser');
  await page.evaluate(countTransitions);
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await page.evaluate(() => (window as unknown as { transitions: number }).transitions)).toBe(1);
});

// issue #116: from light to dark the light page closes into the toggle; from dark to light the light one grows from it
for (const [from, to, expected] of [
  ['light', 'dark', '::view-transition-old(root) reverse'],
  ['dark', 'light', '::view-transition-new(root) normal'],
] as const) {
  test(`from ${from} to ${to} the reveal runs on ${expected}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: from });
    await page.goto('/en/');
    test.skip(!(await page.evaluate(() => 'startViewTransition' in document)), 'no View Transitions in this browser');
    await page.evaluate(() => {
      const w = window as unknown as { reveals?: string[] };
      const original = document.startViewTransition.bind(document);
      document.startViewTransition = (update) => {
        const transition = original(update);
        void transition.ready.then(() => {
          w.reveals = document
            .getAnimations()
            .filter((a): a is CSSAnimation => a instanceof CSSAnimation && a.animationName === 'theme-reveal')
            .map((a) => `${(a.effect as KeyframeEffect).pseudoElement ?? ''} ${a.effect?.getTiming().direction ?? ''}`);
        });
        return transition;
      };
    });
    await page.getByRole('button', { name: `Switch to ${to} theme` }).click();
    await expect.poll(() => page.evaluate(() => (window as unknown as { reveals?: string[] }).reveals)).toEqual([expected]);
  });
}

test('with reduced motion the theme switches at once, without the reveal', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await page.goto('/en/');
  test.skip(!(await page.evaluate(() => 'startViewTransition' in document)), 'no View Transitions in this browser');
  await page.evaluate(countTransitions);
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await page.evaluate(() => (window as unknown as { transitions: number }).transitions)).toBe(0);
});
