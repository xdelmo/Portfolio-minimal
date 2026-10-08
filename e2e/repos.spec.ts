import { readFileSync } from 'node:fs';
import { expect, test } from './fixtures';

// The build links only the repositories GitHub shows to a visitor (scripts/public-repos.mjs, issue #81): every page,
// whatever is public today, links nothing else and leaves no empty list or row of buttons behind.
const PUBLIC = readFileSync('src/app/content/public-repos.generated.ts', 'utf8').match(/https:\/\/github\.com\/xdelmo\/[\w.-]+/g) ?? [];

for (const path of ['/en/', '/it/', '/en/work/apexflow', '/en/work/ice-friends-breaker', '/en/work/telegram-bots', '/it/work/mcp-server']) {
  test(`${path} links only public repositories, with no empty lists`, async ({ page }) => {
    await page.goto(path);
    const repos = await page.locator('a[href^="https://github.com/xdelmo/"]').evaluateAll((links) => links.map((l) => (l as HTMLAnchorElement).href));
    for (const href of repos) expect(PUBLIC, href).toContain(href);
    for (const list of await page.locator('.repos').all()) await expect(list.locator('a')).not.toHaveCount(0);
    for (const row of await page.locator('.links').all()) await expect(row.locator('a').first()).toHaveClass(/button--primary/);
  });
}

test('every link to a repository carries the pixel GitHub mark, hidden from assistive tech', async ({ page }) => {
  for (const path of ['/en/', '/en/work/apexflow']) {
    await page.goto(path);
    const links = page.locator('a[href^="https://github.com/xdelmo/"]');
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const link = links.nth(i);
      await expect(link.locator('app-github-mark svg')).toHaveAttribute('aria-hidden', 'true');
      await expect(link).toHaveAccessibleName((await link.innerText()).trim());
    }
  }
});
