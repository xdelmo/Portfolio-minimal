import { expect, test } from './fixtures';
import { CASE_STUDIES } from './site';

// Touch targets of at least 44×44px on touch screens (issue #130, the mobile best practices the user asked to follow;
// WCAG 2.5.5). A link inside a sentence is exempt, as WCAG allows: it is part of the text, not a control.
const PAGES = ['/en/', '/it/', ...CASE_STUDIES, '/en/privacy/', '/en/404'];

for (const path of PAGES) {
  test(`${path}: every control is at least 44×44px on a touch screen`, async ({ page, isMobile }) => {
    test.skip(!isMobile, 'touch screens');
    await page.goto(path);
    const small = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('a[href], button, summary, input, select')]
        .filter((el) => {
          if (el.closest('p, dd, .bullets, .visually-hidden') || el.classList.contains('skip-link')) return false;
          const box = el.getBoundingClientRect();
          return el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden' && (box.width < 43.5 || box.height < 43.5);
        })
        .map((el) => {
          const box = el.getBoundingClientRect();
          return `${(el.getAttribute('aria-label') ?? el.textContent).trim().replace(/\s+/g, ' ').slice(0, 30)} ${String(Math.round(box.width))}×${String(Math.round(box.height))}`;
        }),
    );
    expect(small).toEqual([]);
  });
}
