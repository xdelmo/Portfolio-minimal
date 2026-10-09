import { readFileSync } from 'node:fs';
import { expect, test, type Page } from './fixtures';

// The Content-Security-Policy that postbuild writes for Netlify (issue #113), served here with every page the test
// server returns: a script, style, image or font the policy would block on the real site fails this test.
const CSP = /^\s+Content-Security-Policy: (.+)$/m.exec(readFileSync('dist/portfolio/browser/_headers', 'utf8'))?.[1];

async function withCsp(page: Page): Promise<string[]> {
  if (!CSP) throw new Error('no Content-Security-Policy in dist/portfolio/browser/_headers');
  await page.route('**/*', async (route) => {
    if (route.request().resourceType() !== 'document') {
      await route.continue();
      return;
    }
    const response = await route.fetch();
    await route.fulfill({ response, headers: { ...response.headers(), 'content-security-policy': CSP } });
  });
  const violations: string[] = [];
  page.on('console', (message) => {
    if (/Content Security Policy|Content-Security-Policy/i.test(message.text())) violations.push(message.text());
  });
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (event) => {
      console.error(`Content Security Policy violation: ${event.violatedDirective} ${event.blockedURI}`);
    });
  });
  return violations;
}

for (const path of ['/en/work/apexflow', '/it/privacy/', '/en/404']) {
  test(`${path} runs under the site's Content Security Policy`, async ({ page }) => {
    const violations = await withCsp(page);
    await page.goto(path);
    await expect(page.locator('app-site-footer [data-press-start]')).toBeVisible();
    expect(violations).toEqual([]);
  });
}

test('the home, the moai, the theme switch and the player card run under the Content Security Policy', async ({ page }) => {
  const violations = await withCsp(page);
  await page.goto('/en/');
  await expect(page.locator('app-home [data-motion]')).toHaveAttribute('data-motion', 'ready');
  await page.locator('app-moai-figure').scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  await page.locator('app-theme-toggle button').click();
  await page.locator('app-site-footer [data-press-start]').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(violations).toEqual([]);
});
