import { expect, test } from './fixtures';

const POST = 'server-side-tables';

test('the menu leads to the blog, which lists every post with its date and reading time', async ({ page, isMobile }) => {
  await page.goto('/en/');
  if (isMobile) await page.locator('app-site-menu summary').click();
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Blog' }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/en\/blog\/?$/);
  await expect(page.locator('h1')).toHaveText('Blog');
  const posts = page.locator('.posts li');
  await expect(posts).toHaveCount(3);
  await expect(posts.first().locator('time')).toHaveAttribute('datetime', /^\d{4}-\d{2}-\d{2}$/);
  await expect(posts.first()).toContainText(/\d+ min read/);
});

test('a post has its title, its date, code the keyboard can reach and a way to its project and back', async ({ page }) => {
  await page.goto(`/en/blog/${POST}`);
  await expect(page.locator('h1')).toHaveText('Ten records is easy, ten thousand is engineering');
  await expect(page.locator('.post .meta time')).toHaveText('11 October 2026');
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
  await button.click();
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
