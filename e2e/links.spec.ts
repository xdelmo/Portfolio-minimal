import { expect, test } from './fixtures';

// Every link to another site opens in a new tab, without handing it this window, and screen readers hear so
// (issue #57): a link added without the attributes fails here, on every page.
const SLUGS = ['apexflow', 'ice-friends-breaker', 'mcp-server', 'telegram-bots'];
const PAGES = ['/en/', '/it/', ...SLUGS.flatMap((s) => [`/en/work/${s}`, `/it/work/${s}`]), '/en/privacy/', '/it/privacy/'];

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
