import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const SLUGS = ['apexflow', 'ice-friends-breaker', 'mcp-server', 'telegram-bots'];
const PAGES = ['/en/', '/it/', ...SLUGS.flatMap((s) => [`/en/work/${s}`, `/it/work/${s}`]), '/en/404', '/it/404'];

for (const path of PAGES) {
  test.describe(path, () => {
    test('loads without console errors and scrolls to the footer', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(path);
      await expect(page.locator('h1')).toHaveCount(1);
      await page.locator('footer').scrollIntoViewIfNeeded();
      await expect(page.locator('footer')).toBeInViewport();
      expect(errors).toEqual([]);
    });

    for (const colorScheme of ['light', 'dark'] as const) {
      test(`meets WCAG 2.2 AA in the ${colorScheme} theme (axe)`, async ({ page }) => {
        await page.emulateMedia({ colorScheme });
        await page.goto(path);
        const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
        expect(results.violations).toEqual([]);
      });
    }
  });
}

test('pages declare the right language', async ({ page }) => {
  await page.goto('/it/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'it');
  await page.goto('/en/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('case study has canonical and hreflang links', async ({ page }) => {
  await page.goto('/it/work/apexflow');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://www.emanueledelmonte.it/it/work/apexflow');
  await expect(page.locator('link[hreflang="en"]')).toHaveAttribute('href', 'https://www.emanueledelmonte.it/en/work/apexflow');
  await expect(page.locator('link[hreflang="x-default"]')).toHaveCount(1);
});

test('the 404 page is localized and offers a way home', async ({ page }) => {
  await page.goto('/it/404');
  await expect(page.locator('h1')).toHaveText('Questa pagina non esiste');
  await expect(page.getByRole('link', { name: 'Vai alla home' })).toBeVisible();
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('content is still there', async ({ page }) => {
    await page.goto('/en/');
    await expect(page.locator('h1')).toContainText('Angular');
    await expect(page.getByRole('link', { name: 'ApexFlow' })).toBeVisible();
  });
});

for (const locale of ['en', 'it']) {
  test(`project images load in the ${locale} build`, async ({ page }) => {
    await page.goto(`/${locale}/`);
    const images = page.locator('#work img.shot');
    await expect(images).toHaveCount(2);
    // query the live DOM on every attempt: WebKit can replace the elements while hydrating
    await expect
      .poll(() =>
        page.evaluate(() =>
          Math.min(
            ...[...document.querySelectorAll<HTMLImageElement>('#work img.shot')].map((img) => {
              img.scrollIntoView();
              return img.naturalWidth;
            }),
          ),
        ),
      )
      .toBeGreaterThan(0);
  });
}

test('the home page has every section in order', async ({ page }) => {
  await page.goto('/en/');
  const ids = await page.locator('main section[id]').evaluateAll((els) => els.map((e) => e.id));
  expect(ids).toEqual(['work', 'side-quests', 'about', 'experience', 'stack', 'contact']);
});

for (const path of ['/en/', '/it/work/apexflow']) {
  test(`${path} is hydrated, not drawn again in the browser`, async ({ page }) => {
    await page.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        (window as unknown as { prerendered: Element | null }).prerendered = document.querySelector('main h1');
      });
    });
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    expect(await page.evaluate(() => (window as unknown as { prerendered: Element | null }).prerendered === document.querySelector('main h1'))).toBe(true);
  });
}

test('each page carries one JSON-LD graph that is replaced when navigating', async ({ page }) => {
  const types = () =>
    page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((els) => els.map((el) => (JSON.parse(el.textContent) as { '@graph': { '@type': string }[] })['@graph'].map((n) => n['@type']).join(',')));
  await page.goto('/en/');
  expect(await types()).toEqual(['WebSite,ProfilePage,Person']);
  await page.locator('#work h3 a').first().click();
  await expect(page).toHaveURL(/\/en\/work\//);
  await expect.poll(types).toEqual(['BreadcrumbList,SoftwareSourceCode,Person']);
});

test('every page links a Markdown twin that exists, and llms.txt is published', async ({ page, request }) => {
  for (const path of ['/en/', '/it/work/apexflow']) {
    await page.goto(path);
    const href = await page.locator('link[rel="alternate"][type="text/markdown"]').getAttribute('href');
    const res = await request.get(new URL(href ?? '').pathname);
    expect(res.ok()).toBe(true);
    expect(await res.text()).toMatch(/^# /);
  }
  const llms = await request.get('/llms.txt');
  expect(await llms.text()).toContain('/it/work/apexflow.md');
});

test('og:image follows the page and is dropped on the 404', async ({ page, request }) => {
  await page.goto('/it/work/apexflow');
  const og = page.locator('meta[property="og:image"]');
  const src = await og.getAttribute('content');
  expect(src).toContain('/it/og/it-apexflow.png');
  expect((await request.get(new URL(src ?? '').pathname)).ok()).toBe(true);
  await page.locator('a[href$="/it/"], a[href="/"]').first().click();
  await expect(og).toHaveAttribute('content', /\/it\/og\/it-home\.png$/);
  await page.goto('/it/404');
  await expect(og).toHaveCount(0);
});

test('an unknown URL shows the not-found page and keeps the URL', async ({ page }) => {
  await page.goto('/en/');
  await page.evaluate(() => {
    history.pushState({}, '', '/en/nope');
    dispatchEvent(new PopStateEvent('popstate'));
  });
  await expect(page.locator('h1')).toHaveText(/not found|doesn.t exist|404/i);
  await expect(page).toHaveURL(/\/en\/nope$/);
});

test('a tall project image asks for the size it is shown at', async ({ page }) => {
  await page.goto('/en/work/ice-friends-breaker');
  await expect(page.locator('img.shot')).toHaveAttribute('sizes', '(min-width: 400px) 360px, 100vw');
});
