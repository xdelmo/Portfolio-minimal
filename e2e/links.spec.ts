import { expect, test } from './fixtures';
import { CASE_STUDIES } from './site';

// Every link to another site opens in a new tab, without handing it this window, and screen readers hear so
// (issue #57): a link added without the attributes fails here, on every page.
const PAGES = ['/en/', '/it/', ...CASE_STUDIES, '/en/privacy/', '/it/privacy/'];

for (const path of PAGES) {
  test(`links to other sites open in a new tab on ${path}`, async ({ page }) => {
    await page.goto(path);
    const external = await page.locator('a[href^="http"]').evaluateAll((links) =>
      links
        .filter((a) => new URL((a as HTMLAnchorElement).href).origin !== location.origin)
        .map((a) => ({
          href: (a as HTMLAnchorElement).href,
          target: a.getAttribute('target'),
          rel: a.getAttribute('rel')?.split(/\s+/).includes('noopener') ?? false,
          describedBy: a.getAttribute('aria-describedby'),
        })),
    );
    expect(external.length).toBeGreaterThan(0);
    for (const link of external) expect(link, link.href).toMatchObject({ target: '_blank', rel: true, describedBy: 'new-tab' });
    await expect(page.locator('#new-tab')).toHaveText(path.startsWith('/it/') ? 'Si apre in una nuova scheda' : 'Opens in a new tab');
  });
}

// A link to an element of this page stays on this page, even before hydration or without JavaScript:
// under <base href="/en/"> a bare "#main" led every inner page's skip link and back to top to the home page.
test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  for (const path of PAGES) {
    test(`links to this page's own sections stay on ${path}`, async ({ page }) => {
      await page.goto(path);
      const strays = await page.locator('a[href*="#"]').evaluateAll((links) => {
        const here = location.pathname.replace(/\/$/, '');
        return links
          .map((a) => new URL((a as HTMLAnchorElement).href))
          .filter((url) => url.origin === location.origin && document.getElementById(url.hash.slice(1)))
          .filter((url) => url.pathname.replace(/\/$/, '') !== here)
          .map((url) => url.pathname + url.hash);
      });
      expect(strays).toEqual([]);
    });
  }
});
