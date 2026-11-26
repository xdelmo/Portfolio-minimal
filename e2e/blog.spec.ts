import { expect, test } from './fixtures';
import { readdirSync } from 'node:fs';

// every post folder, so a new post does not break the count
const POST_COUNT = readdirSync('src/app/content/blog', { withFileTypes: true }).filter((d) => d.isDirectory()).length;

const POST = 'server-side-tables';

test('the menu leads to the blog, which lists every post with its date and reading time', async ({ page, isMobile }) => {
  await page.goto('/en/');
  if (isMobile) await page.locator('app-site-menu summary').click();
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Blog' }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/en\/blog\/?$/);
  await expect(page.locator('h1')).toHaveText('Blog');
  const posts = page.locator('.posts li');
  await expect(posts).toHaveCount(POST_COUNT);
  await expect(posts.first().locator('time')).toHaveAttribute('datetime', /^\d{4}-\d{2}-\d{2}$/);
  await expect(posts.first()).toContainText(/\d+ min read/);
});

test('a post has its title, its date, code the keyboard can reach and a way to its project and back', async ({ page }) => {
  await page.goto(`/en/blog/${POST}`);
  await expect(page.locator('h1')).toHaveText('Ten records is easy, ten thousand is engineering');
  await expect(page.locator('.post .meta time')).toHaveText('2 March 2026');
  const code = page.locator('.prose pre').first();
  await expect(code).toHaveAttribute('tabindex', '0');
  await code.focus();
  await expect(code).toBeFocused();
  await expect(page.locator('script[type="application/ld+json"]#ld-page')).toHaveCount(1);
  expect(await page.locator('#ld-page').textContent()).toContain('"BlogPosting"');
  await page.locator('.more .next').click();
  await expect(page).toHaveURL(/\/en\/work\/apexflow/);
  // the case study links its posts
  await page.getByRole('link', { name: 'Ten records is easy, ten thousand is engineering' }).click();
  await expect(page).toHaveURL(new RegExp(`/en/blog/${POST}`));
});

test('the Italian post sits at the same slug, with its alternates and Markdown twin', async ({ page }) => {
  await page.goto(`/it/blog/${POST}`);
  await expect(page.locator('html')).toHaveAttribute('lang', 'it');
  await expect(page.locator('h1')).toHaveText('Gestire 10 record è facile, gestirne 10.000 è ingegneria');
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', `https://www.emanueledelmonte.it/en/blog/${POST}`);
  const markdown = await page.request.get(`/it/blog/${POST}.md`);
  expect(markdown.status()).toBe(200);
  expect(await markdown.text()).toContain('# Gestire 10 record');
  expect(await (await page.request.get('/llms.txt')).text()).toContain(`/en/blog/${POST}.md`);
});

// issue #191: every code block of a post has a copy button
test('every code block copies its code to the clipboard and says so', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'reading the clipboard back needs the permissions only Chromium grants');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto(`/en/blog/${POST}`);
  const blocks = page.locator('app-code-block');
  await expect(blocks.first()).toBeVisible();
  await expect(blocks.locator('button')).toHaveCount(await blocks.count());
  const first = blocks.first();
  const button = first.getByRole('button', { name: 'Copy code' });
  await first.locator('.code-bar').evaluate((bar) => {
    (window as unknown as { __burstSeen?: number }).__burstSeen = 0;
    new MutationObserver((records) => {
      for (const r of records) {
        for (const n of r.addedNodes) {
          if (n instanceof HTMLElement && n.classList.contains('pixel-burst')) {
            (window as unknown as { __burstSeen: number }).__burstSeen += 1;
          }
        }
      }
    }).observe(bar, { childList: true });
  });
  await button.click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __burstSeen?: number }).__burstSeen ?? 0)).toBe(6);
  await expect(first.locator('.pixel-burst')).toHaveCount(0);
  await expect(first.getByRole('button', { name: 'Copied' })).toBeVisible();
  await expect(first.getByRole('status')).toHaveText('Code copied');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(await first.locator('pre code').textContent());
  // after a moment it offers to copy again
  await expect(first.getByRole('button', { name: 'Copy code' })).toBeVisible();
});

test('the Italian copy button speaks Italian', async ({ page }) => {
  await page.goto(`/it/blog/${POST}`);
  await expect(page.locator('app-code-block').first().getByRole('button', { name: 'Copia il codice' })).toBeVisible();
});

test('the article offers back-to-all link, reading progress, and adjacent navigation (issue #315)', async ({ page }) => {
  await page.goto(`/en/blog/${POST}`);
  const back = page.locator('.intro .back-link');
  await expect(back).toBeVisible();
  await expect(page.locator('.reading-progress')).toBeAttached();
  const adjacent = page.locator('.adjacent .adjacent-card');
  await expect(adjacent.first()).toBeVisible();
});

test('article copy link button copies current URL to clipboard (issue #315)', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'reading the clipboard back needs the permissions only Chromium grants');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto(`/en/blog/${POST}`);
  const copyBtn = page.locator('.meta-row .action-btn');
  await expect(copyBtn).toBeVisible();
  await copyBtn.click();
  await expect(copyBtn).toContainText('Copied');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(`/en/blog/${POST}`);
});

async function expectProgressBelowHeader(page: import('@playwright/test').Page): Promise<void> {
  const bar = page.locator('.reading-progress');
  const fill = page.locator('.reading-progress-fill');
  await expect(async () => {
    const [headerBox, barBox, scale] = await Promise.all([
      page.locator('app-site-header').boundingBox(),
      bar.boundingBox(),
      fill.evaluate((el) => getComputedStyle(el).scale),
    ]);
    expect(headerBox).not.toBeNull();
    expect(barBox).not.toBeNull();
    if (!headerBox || !barBox) return;
    expect(barBox.width).toBeGreaterThan(200);
    expect(barBox.y).toBeGreaterThanOrEqual(headerBox.y + headerBox.height - 1);
    expect(barBox.y).toBeLessThanOrEqual(headerBox.y + headerBox.height + 4);
    expect(parseFloat(scale)).toBeGreaterThan(0.1);
  }).toPass();
}

test('reading progress sits below the header and fills while keeping full width (issue #598)', async ({ page }) => {
  await page.goto(`/en/blog/${POST}`);
  const bar = page.locator('.reading-progress');
  await expect(bar).toBeAttached();
  const initialBox = await bar.boundingBox();
  expect(initialBox?.width ?? 0).toBeGreaterThan(200);

  await page.evaluate(() => {
    window.scrollTo(0, Math.round(document.documentElement.scrollHeight * 0.5));
  });
  await expectProgressBelowHeader(page);
});

test.describe('reading progress under ScrollSmoother (issue #598)', () => {
  test.use({ smoothScroll: true });

  test('pins below the fixed header on desktop scroll', async ({ page, isMobile }) => {
    test.skip(isMobile, 'ScrollSmoother runs on desktop pointers only');
    await page.goto(`/en/blog/${POST}`);
    await page.mouse.move(640, 400);
    await page.mouse.wheel(0, 800);
    await expect
      .poll(async () => {
        const [y, m] = await page.evaluate(() => [
          window.scrollY,
          new DOMMatrix(getComputedStyle(document.getElementById('smooth-content') ?? document.body).transform).m42,
        ]);
        return y > 400 && Math.abs(y + m) < 2;
      })
      .toBe(true);
    await expectProgressBelowHeader(page);
  });
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`code blocks apply syntax colors in the ${colorScheme} theme (issue #597)`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto('/en/blog/signals-in-production');
    const colors = await page.evaluate(() => {
      const code = document.querySelector('app-code-block pre code');
      const kw = document.querySelector('app-code-block .tok-kw');
      const str = document.querySelector('app-code-block .tok-str');
      return {
        code: code ? getComputedStyle(code).color : null,
        kw: kw ? getComputedStyle(kw).color : null,
        str: str ? getComputedStyle(str).color : null,
      };
    });
    expect(colors.kw).not.toBeNull();
    expect(colors.str).not.toBeNull();
    expect(colors.kw).not.toBe(colors.code);
    expect(colors.str).not.toBe(colors.code);
  });
}

// the blog follows the design system: no transition with reduced motion, `/` separators, 16px icons, 32px tags (issue #604)
test('the blog keeps still with reduced motion and follows the design system', async ({ page, context, browserName }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/en/blog/');
  await expect(page.locator('.post-item').first()).toHaveCSS('transition-duration', '0s');
  const preview = page.locator('.post-item .post-preview').first();
  if (await preview.count()) await expect(preview).toHaveCSS('transition-duration', '0s');
  const tag = page.locator('.project-tag').first();
  await expect(tag).toHaveCSS('transition-duration', '0s');
  expect((await tag.boundingBox())?.height).toBeGreaterThanOrEqual(32);
  await page.goto(`/en/blog/${POST}`);
  await expect(page.locator('.byline .meta-sep')).toHaveText('/');
  await expect(page.locator('.adjacent-card').first()).toHaveCSS('transition-duration', '0s');
  await expect(page.locator('app-site-footer .to-top svg')).toHaveCSS('width', '16px');
  const icon = page.locator('.action-btn svg');
  if (await icon.count()) await expect(icon).toHaveAttribute('width', '16');
  if (browserName === 'chromium') {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const firstBar = page.locator('app-code-block .code-bar').first();
    await firstBar.evaluate((bar) => {
      (window as unknown as { __burstReduced?: number }).__burstReduced = 0;
      new MutationObserver((records) => {
        for (const r of records) {
          for (const n of r.addedNodes) {
            if (n instanceof HTMLElement && n.classList.contains('pixel-burst')) {
              (window as unknown as { __burstReduced: number }).__burstReduced += 1;
            }
          }
        }
      }).observe(bar, { childList: true });
    });
    await firstBar.getByRole('button', { name: 'Copy code' }).click();
    await expect(page.locator('app-code-block').first().getByRole('button', { name: 'Copied' })).toBeVisible();
    expect(await page.evaluate(() => (window as unknown as { __burstReduced?: number }).__burstReduced ?? 0)).toBe(0);
  }
});

test('hovering a linked blog row reveals the project preview on desktop only (issue #641)', async ({ page, isMobile }) => {
  await page.goto('/en/blog/');
  const item = page.locator('.post-item', { has: page.locator('.post-preview') }).first();
  const preview = item.locator('.post-preview');
  await expect(preview).toBeAttached();
  if (isMobile) {
    await expect(preview).toBeHidden();
    return;
  }
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(page.locator('.blog[data-motion]')).toHaveAttribute('data-motion', 'ready');
  await expect(preview).toHaveCSS('opacity', '0');
  await item.hover();
  await expect(preview).toHaveCSS('opacity', '1');
});
