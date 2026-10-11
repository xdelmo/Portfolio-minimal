import { expect, test } from './fixtures';

// WCAG 1.4.12: text must survive these spacings without being cut off
const TEXT_SPACING = '* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }';

// at 320 px, the width WCAG 1.4.10 asks content to reflow to (the 404's menu left the page there, issue #155)
for (const path of ['/en/', '/it/work/apexflow', '/en/privacy', '/en/404']) {
  test(`${path} survives WCAG text spacing without clipping`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(path);
    await page.addStyleTag({ content: TEXT_SPACING });
    const clipped = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('main h1, main h2, main h3, main p, main a, main li, header a, header button, footer a')]
        .filter((el) => {
          const style = getComputedStyle(el);
          const hides = [style.overflowX, style.overflowY].some((o) => o === 'hidden' || o === 'clip');
          return hides && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1);
        })
        .map((el) => el.outerHTML.slice(0, 80)),
    );
    expect(clipped).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

// WCAG 2.4.7 and 2.4.11: every stop has a visible ring and is scrolled into view
test('keyboard focus is always visible and on screen', async ({ page, isMobile }) => {
  test.skip(isMobile, 'no Tab key on touch screens');
  await page.goto('/en/');
  // start once the motion chunk is in: its experience pin lengthens the page and would move the footer away from a
  // focus WebKit has just scrolled to
  await expect(page.locator('app-home [data-motion]')).toHaveAttribute('data-motion', 'ready');
  let stops = 0;
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      if (!(el instanceof HTMLElement) || el === document.body) return null;
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        name: `${el.tagName} ${el.textContent.trim().slice(0, 30)}`,
        ring: style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2,
        onScreen: rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth,
      };
    });
    if (!info) continue;
    stops++;
    expect(info.ring, `${info.name} shows a focus ring`).toBe(true);
    // WebKit scrolls the focused element into view a frame later, so give it a moment
    if (!info.onScreen) {
      await expect
        .poll(
          () =>
            page.evaluate(() => {
              const rect = (document.activeElement as HTMLElement).getBoundingClientRect();
              return rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth;
            }),
          { message: `${info.name} is on screen`, timeout: 1000 },
        )
        .toBe(true);
    }
  }
  expect(stops).toBeGreaterThan(20);
});
