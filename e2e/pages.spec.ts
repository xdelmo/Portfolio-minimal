import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from './fixtures';
import { CASE_STUDIES, PROJECTS } from './site';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const PAGES = ['/en/', '/it/', ...CASE_STUDIES, '/en/404', '/it/404', '/en/privacy/', '/it/privacy/'];

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

test('search results get a title that names the skill, in the page language', async ({ page }) => {
  await page.goto('/en/');
  await expect(page).toHaveTitle('Emanuele Del Monte — Angular Frontend Engineer');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /^I build Angular interfaces/);
  await page.goto('/it/');
  await expect(page).toHaveTitle('Emanuele Del Monte — Frontend Engineer Angular');
  await page.goto('/en/work/apexflow');
  await expect(page).toHaveTitle('ApexFlow: Angular, Signals, RxJS — Emanuele Del Monte');
});

test('case study has canonical and hreflang links', async ({ page }) => {
  await page.goto('/it/work/apexflow');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://www.emanueledelmonte.it/it/work/apexflow');
  await expect(page.locator('link[hreflang="en"]')).toHaveAttribute('href', 'https://www.emanueledelmonte.it/en/work/apexflow');
  await expect(page.locator('link[hreflang="x-default"]')).toHaveCount(1);
});

const WILD = {
  en: { title: 'A wild 404 appeared!', menu: 'What to do', moves: ['My work', 'Contact', 'Bag: the player card', 'Run: to the home page'] },
  it: { title: 'È apparso un 404 selvatico!', menu: 'Cosa fare', moves: ['Lavori', 'Contatti', 'Zaino: la scheda giocatore', 'Fuggi: alla home'] },
};
for (const [locale, { title, menu: label, moves }] of Object.entries(WILD)) {
  test(`the ${locale} 404 is a wild encounter with a battle menu`, async ({ page, request }) => {
    // the local server answers 404 for any unknown URL; the per-locale page Netlify serves is checked by verify:deploy
    expect((await request.get(`/${locale}/nope`)).status()).toBe(404);
    await page.goto(`/${locale}/404`);
    await expect(page.locator('h1')).toHaveText(title);
    const nav = page.getByRole('navigation', { name: label });
    const menu = nav.locator('.move');
    for (const [i, name] of moves.entries()) await expect(menu.nth(i)).toHaveAccessibleName(name);
    // two by two, as in the game: right and left in a row, down and up between rows, wrapping round
    await menu.first().focus();
    await page.keyboard.press('ArrowRight');
    await expect(menu.nth(1)).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(menu.nth(3)).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(menu.nth(1)).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(menu.first()).toBeFocused();
    // the bag opens the player card of the Press start easter egg
    await menu.nth(2).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await menu.nth(3).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/$`));
  });
}

const idle = (page: Page) =>
  page.locator('.foe').evaluate((el) =>
    el
      .getAnimations()
      .map((a) => `${(a as CSSAnimation).animationName}:${a.playState}`)
      .filter((a) => a.includes('idle:'))
      // Angular prefixes keyframe names with the component's scope
      .map((a) => a.replace(/^.*idle:/, 'idle:')),
  );

test('the wild 404 bobs while it waits, and the pause button stops it', async ({ page }) => {
  await page.goto('/en/404');
  await expect.poll(() => idle(page)).toEqual(['idle:running']);
  await page.getByRole('button', { name: 'Pause animations' }).click();
  await expect.poll(() => idle(page)).toEqual(['idle:paused']);
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('the wild 404 stands still', async ({ page }) => {
    await page.goto('/en/404');
    await expect(page.locator('h1')).toBeVisible();
    expect(await idle(page)).toEqual([]);
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('content is still there', async ({ page }) => {
    await page.goto('/en/');
    await expect(page.locator('h1')).toContainText('Angular');
    await expect(page.getByRole('link', { name: 'ApexFlow', exact: true })).toBeVisible();
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
  // page and bands alternate: work, About (band), experience, side quests (band), tools, contact (band)
  expect(ids).toEqual(['work', 'about', 'experience', 'side-quests', 'stack', 'contact']);
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
  // the previous page's share image and structured data must not survive client-side navigation
  await expect(page.locator('meta[property="og:image"]')).toHaveCount(0);
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
});

test('a case study ends with the next one, which opens at its top (#91)', async ({ page }) => {
  await page.goto('/it/work/apexflow');
  const next = page.getByRole('navigation', { name: 'Altri progetti' }).getByRole('link', { name: /Progetto successivo/ });
  await next.scrollIntoViewIfNeeded();
  await next.click();
  await expect(page).toHaveURL(/\/it\/work\/ice-friends-breaker$/);
  await expect(page.locator('h1')).toHaveText('Ice Friends Breaker');
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});

test('on desktop a case study keeps an index of its sections beside the text, marking the one being read (#96)', async ({ page, isMobile }) => {
  await page.goto('/en/work/apexflow');
  const toc = page.getByRole('navigation', { name: 'On this page' });
  if (isMobile || (page.viewportSize()?.width ?? 0) < 1024) {
    await expect(toc).toBeHidden();
    return;
  }
  await toc.getByRole('link', { name: 'Key decisions' }).click();
  await expect(page).toHaveURL(/#decisions$/);
  await expect(toc.locator('[aria-current="location"]')).toHaveText('Key decisions');
  // it stays under the header while the page scrolls past it
  const top = await toc.evaluate((el) => el.getBoundingClientRect().top);
  expect(top).toBeGreaterThan(0);
  expect(top).toBeLessThan(200);
});

// issue #114: a shared link names the site; the 404 says what it is and has no empty description; the sitemap repeats
// each page's x-default
test('pages name the site, the 404 says what it is without empty descriptions, the sitemap has x-default', async ({ page, request }) => {
  await page.goto('/en/');
  await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute('content', 'Emanuele Del Monte');
  for (const [path, title] of [['/en/404', 'Page not found — Emanuele Del Monte'], ['/it/404', 'Pagina non trovata — Emanuele Del Monte']]) {
    await page.goto(path);
    await expect(page).toHaveTitle(title);
    await expect(page.locator('meta[name="description"], meta[property="og:description"]')).toHaveCount(0);
  }
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap).toContain('hreflang="x-default" href="https://www.emanueledelmonte.it/en/work/apexflow"');
});

test('a tall project image asks for the size it is shown at', async ({ page }) => {
  await page.goto('/en/work/ice-friends-breaker');
  await expect(page.locator('img.shot')).toHaveAttribute('sizes', '(min-width: 400px) 360px, 100vw');
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`the whole home page meets WCAG 2.2 AA after scrolling through it, ${colorScheme} theme (axe)`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto('/en/');
    // walk down the page so every scroll animation reaches its final state, then check everything at once
    for (let y = 0; y < (await page.evaluate(() => document.documentElement.scrollHeight)); y += 600) {
      await page.evaluate((top) => {
        window.scrollTo(0, top);
      }, y);
      await page.waitForTimeout(60);
    }
    await page.waitForTimeout(1500);
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(results.violations).toEqual([]);
  });
}

test('the Person in the JSON-LD has a photo that is really served', async ({ page, request }) => {
  await page.goto('/it/');
  const graph = await page.locator('script[type="application/ld+json"]').first().textContent();
  const person = (JSON.parse(graph ?? '{}') as { '@graph': { '@type': string; image?: string }[] })['@graph'].find((n) => n['@type'] === 'Person');
  expect(person?.image).toMatch(/\/images\/emanuele\.jpg$/);
  const response = await request.get(new URL(person?.image ?? '').pathname);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('image/jpeg');
});

for (const lang of ['en', 'it']) {
  test(`${lang}: the favicons are the site's own and are served`, async ({ page, request }) => {
    await page.goto(`/${lang}/`);
    const icons = page.locator('link[rel="icon"], link[rel="apple-touch-icon"]');
    const hrefs = await icons.evaluateAll((links) => links.map((l) => (l as HTMLLinkElement).href));
    expect(hrefs.map((h) => new URL(h).pathname).sort()).toEqual(
      [`/${lang}/apple-touch-icon.png`, `/${lang}/favicon.ico`, `/${lang}/favicon.svg`].sort(),
    );
    for (const href of hrefs) expect((await request.get(href)).status(), href).toBe(200);
  });
}

// a case study without a screenshot shows the project's pixel item, the same one as in the work list
for (const { slug, sprite } of PROJECTS.filter((p) => !p.image)) {
  test(`the ${slug} case study opens with its pixel item`, async ({ page }) => {
    await page.goto(`/en/work/${slug}`);
    const item = page.locator('.case-study .item app-quest-sprite');
    await expect(item).toBeVisible();
    await expect(item).toHaveAttribute('data-sprite', sprite ?? '');
    await expect(page.locator('.case-study img.shot')).toHaveCount(0);
  });
}

// A link to a home section from another page lands on that section. The home's motion effects start right after the
// navigation, and ScrollTrigger's first measure (scroll to the top and back) used to stop the smooth scroll after a
// few pixels, on desktop where the pins make it slow: the visitor stayed on the hero.
for (const [from, name, link] of [
  ['/en/404', 'My work', (page: Page) => page.locator('.move', { hasText: 'My work' })],
  ['/en/404', 'Contact', (page: Page) => page.locator('.move', { hasText: 'Contact' })],
  ['/en/work/apexflow', 'Experience', (page: Page) => page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Experience' })],
] as const) {
  test(`${from}: ${name} lands on its home section`, async ({ page, isMobile }) => {
    test.skip(isMobile && from !== '/en/404', 'on phones the header links sit in the menu');
    await page.goto(from);
    const target = link(page);
    const id = ((await target.getAttribute('href')) ?? '').split('#')[1];
    await target.click();
    await expect(page).toHaveURL(new RegExp(`/en/#${id}$`));
    // where scrollIntoView puts it: under the sticky header plus its margin, or as far as the page goes
    const landed = () =>
      page.locator(`#${id}`).evaluate((s) => {
        const top = s.getBoundingClientRect().top;
        const stop = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) + parseFloat(getComputedStyle(s).scrollMarginTop);
        const bottom = scrollY + innerHeight >= document.documentElement.scrollHeight - 2;
        return Math.abs(top - stop) <= 2 || (bottom && top > 0 && top < stop + innerHeight);
      });
    await expect.poll(landed, { timeout: 5000 }).toBe(true);
  });
}
