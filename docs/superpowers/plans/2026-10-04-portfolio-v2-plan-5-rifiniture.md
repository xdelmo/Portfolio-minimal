# Portfolio v2 — Piano 5: Rifiniture — Implementation Plan

## Stato (2026-10-06): completato. Il movimento CSS-first è stato sostituito da GSAP lazy nel piano 7.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish SEO/GEO (JSON-LD graph, Open Graph images, `llms.txt` and Markdown pages), add the remaining motion from spec §10.2, close the cheap user-facing minors and pin the manual WCAG checks that can be automated.

**Architecture:** Everything that can break is a pure function with a test: JSON-LD and OG URLs in `core/seo/seo.ts`, Markdown/llms output in `scripts/geo-files.mjs`, the OG check in `scripts/seo-files.mjs`. Build-time scripts read the same `content.{en,it}.ts` files as the app through a tiny Node resolve hook, so site, JSON-LD and Markdown cannot drift apart. Motion is CSS-first (scroll-driven animations, View Transitions) and switched off by `prefers-reduced-motion`.

**Tech Stack:** Angular 22.2, Node 24 type stripping + `module.registerHooks`, Playwright (image rendering and e2e), CSS `animation-timeline: view()`, View Transitions API.

**Spec:** `docs/superpowers/specs/2026-10-03-portfolio-v2-design.md` (§8 SEO, §9 GEO, §10 motion, §11 accessibility, §12 targets)

## Global Constraints

- Every command runs with `export PATH="$HOME/.local/node/current/bin:$PATH";` in front.
- `npm run lint` with zero warnings; typescript-eslint strictTypeChecked rules (no `?.`/`??` on non-null values, `String()` for numbers in template literals).
- WCAG 2.2 AA on every page, both themes, both languages (spec §11); axe tags `wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa`.
- Initial JavaScript < 150 KB gzip (postbuild enforces it); no new runtime dependency.
- `prefers-reduced-motion: reduce` → no scroll animations, no view-transition animation (spec §11).
- Content is bilingual: every new UI string has an `@@id` and an Italian target in `messages.it.xlf`.
- The CV is never published; nothing in this plan adds personal data beyond what the site already shows.

## Review Focus

1. Client-side navigation home → case study → 404 leaves stale JSON-LD or `og:image` in the head → each page must replace (not append) its structured data and drop the image on noindex pages.
2. A project added to `content.*.ts` without running the OG script → the build must fail, not ship a broken `og:image`.
3. Markdown output with characters that mean something in Markdown (`*`, `_`, `[`) in titles or summaries → the files must stay readable; the current content has none, so the generator escapes nothing and a test pins the plain-text contract.
4. Scroll-driven heading reveal leaving headings clipped when the page loads scrolled (anchor link `/#work`, back navigation) → headings already in view must end fully visible.
5. Keyboard users tabbing under the sticky header → the focused element must never be hidden behind it (WCAG 2.4.11).

---

### Task 1: JSON-LD graph per page

**Files:**
- Modify: `src/app/core/seo/seo.ts`, `src/app/core/seo/seo.spec.ts`
- Modify: `src/app/pages/home/home.ts`, `src/app/pages/case-study/case-study.ts`, `src/app/pages/not-found/not-found.ts`
- Test: `e2e/pages.spec.ts`

**Interfaces:**
- Produces: `homeJsonLd(person: Person, locale: Locale): Record<string, unknown>`, `caseStudyJsonLd(project: Project, person: Person, locale: Locale): Record<string, unknown>`, `PERSON_ID = 'https://www.emanueledelmonte.it/#person'`, script id `ld-page` used by every page.

- [ ] **Step 1: Write the failing unit tests** (replace the `personJsonLd` describe in `seo.spec.ts`)

```ts
describe('homeJsonLd', () => {
  const graph = (homeJsonLd(CONTENT_EN.person, 'en')['@graph'] as Record<string, unknown>[]);
  const byType = (type: string) => graph.find((n) => n['@type'] === type) as Record<string, unknown>;

  it('links WebSite, ProfilePage and Person through one person id', () => {
    expect(graph.map((n) => n['@type'])).toEqual(['WebSite', 'ProfilePage', 'Person']);
    expect(byType('Person')['@id']).toBe(PERSON_ID);
    expect(byType('ProfilePage')['mainEntity']).toEqual({ '@id': PERSON_ID });
    expect(byType('WebSite')['publisher']).toEqual({ '@id': PERSON_ID });
  });

  it('describes the person with consistent identity links', () => {
    const person = byType('Person');
    expect(person['name']).toBe('Emanuele Del Monte');
    expect(person['sameAs']).toEqual([CONTENT_EN.person.linkedin, CONTENT_EN.person.github]);
    expect(person['address']).toEqual({ '@type': 'PostalAddress', addressLocality: 'Latina', addressCountry: 'IT' });
    expect(byType('ProfilePage')['url']).toBe('https://www.emanueledelmonte.it/en/');
    expect(byType('ProfilePage')['inLanguage']).toBe('en');
  });
});

describe('caseStudyJsonLd', () => {
  const project = CONTENT_IT.projects[0];
  const graph = (caseStudyJsonLd(project, CONTENT_IT.person, 'it')['@graph'] as Record<string, unknown>[]);
  const byType = (type: string) => graph.find((n) => n['@type'] === type) as Record<string, unknown>;

  it('has a two-step breadcrumb from the localized home', () => {
    expect(byType('BreadcrumbList')['itemListElement']).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Emanuele Del Monte', item: 'https://www.emanueledelmonte.it/it/' },
      { '@type': 'ListItem', position: 2, name: project.title, item: `https://www.emanueledelmonte.it/it/work/${project.slug}` },
    ]);
  });

  it('describes the code with its repositories and the author', () => {
    const code = byType('SoftwareSourceCode');
    expect(code['name']).toBe(project.title);
    expect(code['codeRepository']).toBe(project.repos[0].url);
    expect(code['author']).toEqual({ '@id': PERSON_ID });
    expect(code['inLanguage']).toBe('it');
    expect(byType('Person')['@id']).toBe(PERSON_ID);
  });
});
```

Imports at the top become `import { PERSON_ID, caseStudyJsonLd, headLinks, homeJsonLd, pageUrl } from './seo';` plus `CONTENT_IT`.

- [ ] **Step 2: Run to verify it fails**

Run: `npx ng test --no-watch --include src/app/core/seo/seo.spec.ts`
Expected: FAIL (`homeJsonLd` is not exported).

- [ ] **Step 3: Implement** in `seo.ts` (replacing `personJsonLd`)

```ts
export const PERSON_ID = `${SITE_URL}/#person`;

function personNode(person: Person, locale: Locale): Record<string, unknown> {
  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: person.name,
    url: pageUrl('/', locale),
    jobTitle: person.role,
    worksFor: { '@type': 'Organization', name: person.employer },
    alumniOf: { '@type': 'CollegeOrUniversity', name: 'Università Mercatorum' },
    address: { '@type': 'PostalAddress', addressLocality: 'Latina', addressCountry: 'IT' },
    email: `mailto:${person.email}`,
    sameAs: [person.linkedin, person.github],
    knowsAbout: person.knowsAbout,
  };
}

export function homeJsonLd(person: Person, locale: Locale): Record<string, unknown> {
  const url = pageUrl('/', locale);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebSite', '@id': `${SITE_URL}/#website`, url: `${SITE_URL}/`, name: person.name, publisher: { '@id': PERSON_ID }, inLanguage: ['en', 'it'] },
      { '@type': 'ProfilePage', '@id': `${url}#page`, url, name: `${person.name} — ${person.role}`, inLanguage: locale, mainEntity: { '@id': PERSON_ID } },
      personNode(person, locale),
    ],
  };
}

export function caseStudyJsonLd(project: Project, person: Person, locale: Locale): Record<string, unknown> {
  const url = pageUrl(`/work/${project.slug}`, locale);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: person.name, item: pageUrl('/', locale) },
          { '@type': 'ListItem', position: 2, name: project.title, item: url },
        ],
      },
      {
        '@type': 'SoftwareSourceCode',
        '@id': `${url}#code`,
        url,
        name: project.title,
        description: project.summary,
        codeRepository: project.repos[0].url,
        programmingLanguage: project.stack,
        inLanguage: locale,
        author: { '@id': PERSON_ID },
      },
      personNode(person, locale),
    ],
  };
}
```

Pages: home calls `this.seo.setJsonLd('ld-page', homeJsonLd(person, this.locale))`; case study calls `this.seo.setJsonLd('ld-page', p ? caseStudyJsonLd(p, this.content.person, this.locale) : null)` (inject `LOCALE_ID` → `toLocale`); not-found calls `inject(SeoService).setJsonLd('ld-page', null)`.

- [ ] **Step 4: e2e — one structured-data script per page, replaced on client navigation** (add to `e2e/pages.spec.ts`)

```ts
test('each page carries one JSON-LD graph that is replaced when navigating', async ({ page }) => {
  const types = () => page.locator('script[type="application/ld+json"]').evaluateAll((els) => els.map((el) => (JSON.parse(el.textContent ?? '{}') as { '@graph': { '@type': string }[] })['@graph'].map((n) => n['@type']).join(',')));
  await page.goto('/en/');
  expect(await types()).toEqual(['WebSite,ProfilePage,Person']);
  await page.locator('#work h3 a').first().click();
  await expect(page).toHaveURL(/\/en\/work\//);
  expect(await types()).toEqual(['BreadcrumbList,SoftwareSourceCode,Person']);
});
```

- [ ] **Step 5: Run unit + lint + this e2e (after `npm run build`)**

Run: `npx ng test --no-watch && npm run lint && npm run build && npx playwright test e2e/pages.spec.ts --project=chromium -g "JSON-LD"`
Expected: all PASS.

- [ ] **Step 6: Commit** — `feat: describe each page with one linked JSON-LD graph`

---

### Task 2: Markdown pages and llms.txt from the content files (GEO)

**Files:**
- Create: `scripts/ts-resolve.mjs`, `scripts/geo-files.mjs`, `scripts/geo-files.test.mjs`
- Modify: `src/app/content/content.en.ts`, `content.it.ts` (`import type`), `scripts/postbuild.mjs`, `package.json` (build script), `src/app/core/seo/seo.ts` + `seo.service.ts` (markdown alternate link), `netlify.toml` (Content-Type), `e2e/pages.spec.ts`

**Interfaces:**
- Produces: `markdownPath(path: string, locale: Locale): string` in `seo.ts` (`'/'` → `/en/index.md`, `/work/x` → `/en/work/x.md`); in `geo-files.mjs`: `homeMarkdown(content, locale)`, `projectMarkdown(project, content, locale)`, `llmsTxt(contents)` (contents = `{ en, it }`), `geoFiles(contents): { path: string; body: string }[]` (paths relative to the publish root).
- Consumes: `SITE_URL`, `pageUrl` semantics (`/en/`, `/en/work/<slug>`).

- [ ] **Step 1: Write the failing tests** (`scripts/geo-files.test.mjs`, fixture content, no app imports)

```js
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { geoFiles, homeMarkdown, llmsTxt, projectMarkdown } from './geo-files.mjs';

const project = {
  slug: 'demo', title: 'Demo', summary: 'A demo project.', stack: ['Angular', 'RxJS'],
  repos: [{ label: 'Code', url: 'https://github.com/x/demo' }], demoUrl: 'https://demo.example',
  caseStudy: { context: 'Why.', architecture: ['One', 'Two'], decisions: [{ title: 'Pick A', body: 'Because.' }], outcome: 'Done.' },
};
const content = {
  person: { name: 'Ada', role: 'Frontend Engineer', location: 'Latina, Italy', availability: 'Open from March.', email: 'a@x.it', linkedin: 'https://li/ada', github: 'https://gh/ada' },
  hero: { headline: 'Headline.', lede: 'Lede.' }, about: 'About.',
  glance: [{ label: 'Role', value: 'FE' }], projects: [project],
  experience: [{ period: '2026', title: 'Engineer', org: 'IPS', summary: 'Work.' }],
  sideQuests: [{ title: 'Quest', summary: 'Fun.', tags: ['WP'] }], stack: [{ name: 'Front end', items: ['Angular'] }],
};

test('home markdown starts with the person and lists every section as plain text', () => {
  const md = homeMarkdown(content, 'en');
  assert.match(md, /^# Ada — Frontend Engineer\n\nHeadline\.\n\nLede\. Open from March\./);
  for (const part of ['- Role: FE', '[Demo](https://www.emanueledelmonte.it/en/work/demo): A demo project.', '- 2026 — Engineer, IPS: Work.', '- Front end: Angular', 'Email: a@x.it']) assert.ok(md.includes(part), part);
});

test('project markdown has the case-study sections in the page language', () => {
  const md = projectMarkdown(project, content, 'it');
  assert.match(md, /^# Demo\n\nA demo project\.\n\nStack: Angular, RxJS/);
  for (const part of ['## Contesto', '- One', '### Pick A', '## Risultato', '- [Code](https://github.com/x/demo)', 'Demo: https://demo.example']) assert.ok(md.includes(part), part);
});

test('llms.txt links every markdown page of both languages', () => {
  const txt = llmsTxt({ en: content, it: content });
  assert.match(txt, /^# Ada\n\n> Frontend Engineer, Latina, Italy\./);
  for (const url of ['/en/index.md', '/it/index.md', '/en/work/demo.md', '/it/work/demo.md']) assert.ok(txt.includes(`https://www.emanueledelmonte.it${url}`), url);
});

test('geoFiles writes one file per page plus llms.txt and llms-full.txt', () => {
  const paths = geoFiles({ en: content, it: content }).map((f) => f.path).sort();
  assert.deepEqual(paths, ['en/index.md', 'en/work/demo.md', 'it/index.md', 'it/work/demo.md', 'llms-full.txt', 'llms.txt']);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test scripts/geo-files.test.mjs`
Expected: FAIL (cannot find `geo-files.mjs`).

- [ ] **Step 3: Implement `scripts/geo-files.mjs`**

```js
// Markdown versions of every page and llms.txt (spec §9), built from the same content as the site.
const SITE_URL = 'https://www.emanueledelmonte.it';
const LABELS = {
  en: { work: 'Selected work', quests: 'Side quests', about: 'About', experience: 'Experience', stack: 'Stack', contact: 'Contact', context: 'Context', architecture: 'How it is built', decisions: 'Key decisions', outcome: 'Outcome', code: 'Code', cv: 'CV available on request.' },
  it: { work: 'Lavori selezionati', quests: 'Side quest', about: 'Chi sono', experience: 'Esperienza', stack: 'Stack', contact: 'Contatti', context: 'Contesto', architecture: 'Come è fatto', decisions: 'Scelte chiave', outcome: 'Risultato', code: 'Codice', cv: 'CV disponibile su richiesta.' },
};
const url = (locale, path = '') => `${SITE_URL}/${locale}/${path}`;

export function homeMarkdown(c, locale) {
  const l = LABELS[locale];
  return [
    `# ${c.person.name} — ${c.person.role}`,
    c.hero.headline,
    `${c.hero.lede} ${c.person.availability}`,
    c.glance.map((g) => `- ${g.label}: ${g.value}`).join('\n'),
    `## ${l.work}`,
    c.projects.map((p) => `- [${p.title}](${url(locale, `work/${p.slug}`)}): ${p.summary}`).join('\n'),
    `## ${l.quests}`,
    c.sideQuests.map((q) => `- ${q.title}: ${q.summary}`).join('\n'),
    `## ${l.about}`,
    c.about,
    `## ${l.experience}`,
    c.experience.map((e) => `- ${e.period} — ${e.title}, ${e.org}: ${e.summary}`).join('\n'),
    `## ${l.stack}`,
    c.stack.map((g) => `- ${g.name}: ${g.items.join(', ')}`).join('\n'),
    `## ${l.contact}`,
    [`Email: ${c.person.email}`, `LinkedIn: ${c.person.linkedin}`, `GitHub: ${c.person.github}`, l.cv].join('\n'),
  ].join('\n\n') + '\n';
}

export function projectMarkdown(p, c, locale) {
  const l = LABELS[locale];
  const links = [...(p.demoUrl ? [`Demo: ${p.demoUrl}`] : []), ...p.repos.map((r) => `- [${r.label}](${r.url})`)];
  return [
    `# ${p.title}`,
    p.summary,
    `Stack: ${p.stack.join(', ')}`,
    `## ${l.code}`,
    links.join('\n'),
    `## ${l.context}`,
    p.caseStudy.context,
    `## ${l.architecture}`,
    p.caseStudy.architecture.map((a) => `- ${a}`).join('\n'),
    `## ${l.decisions}`,
    p.caseStudy.decisions.map((d) => `### ${d.title}\n\n${d.body}`).join('\n\n'),
    `## ${l.outcome}`,
    p.caseStudy.outcome,
    `${c.person.name}, ${c.person.role}: ${url(locale)}`,
  ].join('\n\n') + '\n';
}

export function llmsTxt(contents) {
  const { en } = contents;
  const lines = [`# ${en.person.name}`, `> ${en.person.role}, ${en.person.location}. ${en.hero.lede} ${en.person.availability}`];
  for (const [locale, c] of Object.entries(contents)) {
    lines.push(`## ${locale === 'it' ? 'Italiano' : 'English'}`, [
      `- [${c.person.name} — ${c.person.role}](${url(locale, 'index.md')}): ${c.hero.headline}`,
      ...c.projects.map((p) => `- [${p.title}](${url(locale, `work/${p.slug}.md`)}): ${p.summary}`),
    ].join('\n'));
  }
  return lines.join('\n\n') + '\n';
}

export function geoFiles(contents) {
  const pages = [];
  for (const [locale, c] of Object.entries(contents)) {
    pages.push({ path: `${locale}/index.md`, body: homeMarkdown(c, locale) });
    for (const p of c.projects) pages.push({ path: `${locale}/work/${p.slug}.md`, body: projectMarkdown(p, c, locale) });
  }
  return [...pages, { path: 'llms.txt', body: llmsTxt(contents) }, { path: 'llms-full.txt', body: pages.map((p) => p.body).join('\n---\n\n') }];
}
```

Check the Italian labels against `messages.it.xlf` (`@@case.context`, `@@case.architecture`, `@@case.decisions`, `@@case.outcome`, nav ids) and copy the exact targets, so Markdown and HTML use the same words.

- [ ] **Step 4: Run to verify it passes**

Run: `node --test scripts/geo-files.test.mjs`
Expected: 4/4 PASS.

- [ ] **Step 5: Load the content files from Node**

`scripts/ts-resolve.mjs`:

```js
// Lets build scripts import the app's .ts content files: Node strips the types, this adds the missing ".ts" extension.
import { registerHooks } from 'node:module';

registerHooks({
  resolve(specifier, context, next) {
    try {
      return next(specifier, context);
    } catch (error) {
      if (specifier.startsWith('.') && !specifier.endsWith('.ts')) return next(`${specifier}.ts`, context);
      throw error;
    }
  },
});
```

In `content.en.ts` / `content.it.ts`: `import type { … } from './content.model';` (only types come from there). `package.json` build: `ng build && node --import ./scripts/ts-resolve.mjs scripts/postbuild.mjs`.

`postbuild.mjs` gains, before the sitemap:

```js
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { geoFiles } from './geo-files.mjs';
import { CONTENT_EN } from '../src/app/content/content.en.ts';
import { CONTENT_IT } from '../src/app/content/content.it.ts';

const geo = geoFiles({ en: CONTENT_EN, it: CONTENT_IT });
for (const file of geo) {
  await mkdir(dirname(join(ROOT, file.path)), { recursive: true });
  await writeFile(join(ROOT, file.path), file.body);
}
console.log(`postbuild: ${String(geo.length)} Markdown and llms files`);
```

- [ ] **Step 6: Point each page at its Markdown version** — unit test first in `seo.spec.ts`:

```ts
describe('markdownPath', () => {
  it('maps pages to their Markdown twin', () => {
    expect(markdownPath('/', 'en')).toBe('/en/index.md');
    expect(markdownPath('/work/apexflow', 'it')).toBe('/it/work/apexflow.md');
  });
});
```

Run it (FAIL), then implement:

```ts
export function markdownPath(path: string, locale: Locale): string {
  const clean = path.split(/[?#]/)[0].replace(/\/+$/, '');
  return `/${locale}${clean === '' ? '/index' : clean}.md`;
}
```

In `SeoService.update`, after the hreflang loop (indexable pages only), append `<link rel="alternate" type="text/markdown" href="${SITE_URL}${markdownPath(page.path, this.locale)}" data-seo>`. `netlify.toml`:

```toml
[[headers]]
  for = "/*.md"
  [headers.values]
    Content-Type = "text/markdown; charset=utf-8"
```

- [ ] **Step 7: e2e** (in `e2e/pages.spec.ts`)

```ts
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
```

- [ ] **Step 8: Run everything touched**

Run: `npm run test:scripts && npx ng test --no-watch && npm run lint && npm run build && npx playwright test e2e/pages.spec.ts --project=chromium -g "Markdown"`
Expected: PASS; build log prints `postbuild: 22 Markdown and llms files`.

- [ ] **Step 9: Commit** — `feat: publish Markdown versions of every page and llms.txt`

---

### Task 3: Open Graph images

**Files:**
- Create: `scripts/og-images.mjs`, `public/og/*.png` (10 files)
- Modify: `src/app/core/seo/seo.ts` (+spec), `seo.service.ts`, `src/app/pages/home/home.ts`, `case-study.ts`, `scripts/seo-files.mjs` (+test), `scripts/postbuild.mjs`, `package.json` (`og:images` script)

**Interfaces:**
- Produces: `ogImageUrl(key: string, locale: Locale): string` → `https://www.emanueledelmonte.it/<locale>/og/<locale>-<key>.png`; `PageSeo.ogImage?: string` (key: `'home'` or the project slug); `extractOgImage(html: string): string | null` in `seo-files.mjs`.

- [ ] **Step 1: Failing tests**

`seo.spec.ts`:

```ts
describe('ogImageUrl', () => {
  it('points at the per-locale image inside the locale build', () => {
    expect(ogImageUrl('home', 'it')).toBe('https://www.emanueledelmonte.it/it/og/it-home.png');
  });
});
```

`scripts/seo-files.test.mjs`:

```js
test('extractOgImage reads the og:image meta, or null', () => {
  assert.equal(extractOgImage('<meta property="og:image" content="https://x/en/og/en-home.png">'), 'https://x/en/og/en-home.png');
  assert.equal(extractOgImage('<meta name="robots" content="noindex">'), null);
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx ng test --no-watch --include src/app/core/seo/seo.spec.ts; npm run test:scripts`
Expected: both FAIL on the missing exports.

- [ ] **Step 3: Implement**

```ts
export function ogImageUrl(key: string, locale: Locale): string {
  return `${SITE_URL}/${locale}/og/${locale}-${key}.png`;
}
```

```js
export function extractOgImage(html) {
  return /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/.exec(html)?.[1] ?? null;
}
```

`SeoService.update`: when `page.ogImage` is set, `updateTag` `og:image` (+ `og:image:width` 1200, `og:image:height` 630, `og:image:alt` = title) and `twitter:image`; otherwise `removeTag("property='og:image'")`, `removeTag("property='og:image:width'")`, `removeTag("property='og:image:height'")`, `removeTag("property='og:image:alt'")`, `removeTag("name='twitter:image'")`. Home passes `ogImage: 'home'`, case study `ogImage: p.slug`.

- [ ] **Step 4: Render the images** — `scripts/og-images.mjs` (run with `npm run og:images` = `node --import ./scripts/ts-resolve.mjs scripts/og-images.mjs`):

```js
// Renders the 1200×630 Open Graph images (spec §8), one per page and language, into public/og/.
// Run after changing titles or summaries: npm run og:images
import { chromium } from 'playwright';
import { CONTENT_EN } from '../src/app/content/content.en.ts';
import { CONTENT_IT } from '../src/app/content/content.it.ts';

const font = 'node_modules/@fontsource-variable/instrument-sans/files/instrument-sans-latin-wght-normal.woff2';
const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
// pastel pixels on the right, like the hero field (palette from src/styles/_tokens.scss)
const PIXELS = ['#a8e0c8', '#ffc9a8', '#c9c2f2', '#a8d4f0'];
const field = Array.from({ length: 22 * 16 }, (_, i) => {
  const x = i % 22, y = Math.floor(i / 22);
  const on = (x * 7 + y * 13) % 5 === 0 || (x + y) % 9 === 0;
  return on ? `<rect x="${String(x * 24)}" y="${String(y * 24)}" width="16" height="16" fill="${PIXELS[(x + y) % 4]}"/>` : '';
}).join('');

const page = await (await chromium.launch()).newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent('<p>');
const fontData = (await import('node:fs')).readFileSync(font).toString('base64');
for (const [locale, c] of [['en', CONTENT_EN], ['it', CONTENT_IT]]) {
  const cards = [['home', `${c.person.name}`, c.hero.headline], ...c.projects.map((p) => [p.slug, p.title, p.summary])];
  for (const [key, title, line] of cards) {
    await page.setContent(`<style>
      @font-face { font-family: IS; src: url(data:font/woff2;base64,${fontData}); }
      body { margin: 0; width: 1200px; height: 630px; background: #fafaf7; color: #1d1d1b; font-family: IS; display: grid; grid-template-columns: 680px 1fr; }
      main { padding: 72px; display: grid; align-content: space-between; }
      h1 { margin: 0; font-size: 72px; line-height: 1.05; letter-spacing: -0.02em; }
      p { margin: 24px 0 0; font-size: 30px; line-height: 1.35; color: #4a4a46; }
      footer { font-size: 26px; font-weight: 600; }
    </style><main><div><h1>${escape(title)}</h1><p>${escape(line)}</p></div><footer>${escape(c.person.name)} · ${escape(c.person.role)}</footer></main>
    <svg viewBox="0 0 528 384" width="520" height="630" preserveAspectRatio="xMidYMid slice">${field}</svg>`);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `public/og/${locale}-${key}.png` });
  }
}
await page.context().browser()?.close();
console.log('public/og: done');
```

Before running, read `_tokens.scss` and replace `#fafaf7`, `#1d1d1b`, `#4a4a46` and `PIXELS` with the light theme's `--bg`, `--fg`, `--fg-muted` and pixel colours, and pick the font file that exists in `node_modules/@fontsource-variable/instrument-sans/files/`. Check one image by eye (Read the PNG). Ruling allowed: the footer's middle dot is plain text in an image, not page chrome.

- [ ] **Step 5: Fail the build on a missing image** — in `postbuild.mjs`, inside the per-page loop:

```js
const og = extractOgImage(html);
if (og) {
  const file = join(ROOT, new URL(og).pathname);
  await readFile(file).catch(() => { throw new Error(`postbuild: ${og} is missing, run npm run og:images`); });
}
```

- [ ] **Step 6: Verify**

Run: `npm run og:images && npx ng test --no-watch && npm run test:scripts && npm run lint && npm run build && grep -o 'og:image" content="[^"]*' dist/portfolio/browser/it/work/apexflow/index.html`
Expected: tests pass, build passes, grep prints `.../it/og/it-apexflow.png`. Then `mv public/og/it-apexflow.png $CLAUDE_JOB_DIR/tmp/ && npm run build` → FAIL with "is missing"; move it back.

- [ ] **Step 7: e2e** (in `e2e/pages.spec.ts`)

```ts
test('og:image follows the page and is dropped on the 404', async ({ page, request }) => {
  await page.goto('/it/work/apexflow');
  const og = page.locator('meta[property="og:image"]');
  const src = await og.getAttribute('content');
  expect(src).toContain('/it/og/it-apexflow.png');
  expect((await request.get(new URL(src ?? '').pathname)).ok()).toBe(true);
  await page.goto('/it/404');
  await expect(og).toHaveCount(0);
});
```

- [ ] **Step 8: Commit** — `feat: add per-page Open Graph images and fail the build when one is missing`

---

### Task 4: Scroll motion — heading reveal, timeline line, view transitions

**Files:**
- Modify: `src/styles/_base.scss` (heading reveal + view-transition reduced motion), `src/app/sections/experience-timeline/experience-timeline.ts` (line), `src/app/sections/work-list/work-list.ts` + `case-study.ts` (`view-transition-name`)
- Test: `e2e/motion.spec.ts` (new)

**Interfaces:**
- Produces: the view-transition name `title-<slug>` on the work-list `h3` and on the case-study `h1`.

Ruling recorded in the ledger at the start of the task: spec §10.1 names GSAP + SplitText for the line-by-line title reveal; this plan uses CSS scroll-driven animations instead (no new 70 KB dependency, no JS, nothing to clean up, nothing to break during hydration). Cost if wrong: titles reveal as a block instead of line by line, and not at all in browsers without `animation-timeline` (content stays fully visible there).

- [ ] **Step 1: Write the failing e2e** (`e2e/motion.spec.ts`)

```ts
import { expect, test } from '@playwright/test';

test('section titles reveal on scroll and end fully visible', async ({ page }) => {
  await page.goto('/en/');
  const title = page.locator('#experience h2');
  expect(await title.evaluate((el) => getComputedStyle(el).animationName)).toBe('reveal-title');
  await title.scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, -window.innerHeight / 3));
  await expect.poll(() => title.evaluate((el) => getComputedStyle(el).clipPath)).toMatch(/^(none|inset\(0(px)?\))$/);
});

test('a title already in view on load is not left clipped', async ({ page }) => {
  await page.goto('/en/#work');
  const title = page.locator('#work h2');
  await expect.poll(() => title.evaluate((el) => getComputedStyle(el).clipPath)).toMatch(/^(none|inset\(0(px)?\))$/);
});

test('the experience line draws with scroll', async ({ page }) => {
  await page.goto('/en/');
  const line = page.locator('app-experience-timeline .timeline');
  expect(await line.evaluate((el) => getComputedStyle(el, '::before').animationName)).toBe('draw-line');
});

test('project title and case-study heading share a view-transition name', async ({ page }) => {
  await page.goto('/en/');
  const card = page.locator('#work h3').first();
  const name = await card.evaluate((el) => getComputedStyle(el).viewTransitionName);
  expect(name).toMatch(/^title-/);
  await card.locator('a').click();
  await expect(page.locator('h1')).toHaveCSS('view-transition-name', name);
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('titles and the line do not animate', async ({ page }) => {
    await page.goto('/en/');
    expect(await page.locator('#experience h2').evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
    expect(await page.locator('app-experience-timeline .timeline').evaluate((el) => getComputedStyle(el, '::before').animationName)).toBe('none');
  });
});
```

Firefox has no `animation-timeline`: guard the first three tests with `test.skip(browserName === 'firefox', 'no scroll-driven animations; titles stay static')`.

- [ ] **Step 2: Run to verify it fails**

Run: `npm run build && npx playwright test e2e/motion.spec.ts --project=chromium`
Expected: FAIL (`animationName` is `none`).

- [ ] **Step 3: Implement**

`_base.scss`:

```scss
@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) {
    main section > h2 {
      animation: reveal-title linear both;
      animation-timeline: view();
      animation-range: entry 0% entry 60%;
    }
  }
}

@keyframes reveal-title {
  from {
    clip-path: inset(0 0 100% 0);
    translate: 0 0.4em;
  }
  to {
    clip-path: inset(0);
    translate: 0 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation: none !important;
  }
}
```

Experience timeline styles: `.timeline { position: relative; padding-left: var(--space-3); }` with

```scss
.timeline::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 2px;
  background: var(--rule);
  transform-origin: top;
}
@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) {
    .timeline::before {
      animation: draw-line linear both;
      animation-timeline: view();
      animation-range: entry 20% cover 60%;
    }
  }
}
@keyframes draw-line {
  from { transform: scaleY(0); }
  to { transform: scaleY(1); }
}
```

Check the timeline's existing markers/padding first and fit the line to them (the line is decorative, colour `--rule` must stay ≥ 3:1 only if it carries meaning — it does not).

View transitions: work-list `<h3 [style.view-transition-name]="'title-' + project.slug">`; case study `<h1 [style.view-transition-name]="'title-' + p.slug">`.

- [ ] **Step 4: Run to verify it passes, plus axe**

Run: `npm run build && npx playwright test e2e/motion.spec.ts e2e/pages.spec.ts --project=chromium --project=firefox`
Expected: all PASS (Firefox skips the three scroll tests).

- [ ] **Step 5: Commit** — `feat: reveal section titles and draw the experience line with scroll, morph project titles into the case study`

---

### Task 5: Pixelate the project image on hover

**Files:**
- Create: `public/images/work/apexflow-40.jpg`, `ice-friends-breaker-40.jpg`
- Modify: `src/app/sections/work-list/work-list.ts`, `src/app/content/image-loader.ts` (if the pixel source is derived there), `CLAUDE.md` (variant note)
- Test: `src/app/content/image-loader.spec.ts` (if it exists, else in work-list spec), `e2e/motion.spec.ts`

**Interfaces:**
- Produces: `pixelSrc(src: string): string` in `image-loader.ts` (`images/work/a.jpg` → `images/work/a-40.jpg`).

- [ ] **Step 1: Failing unit test**

```ts
it('derives the 40px pixel variant', () => {
  expect(pixelSrc('images/work/apexflow.jpg')).toBe('images/work/apexflow-40.jpg');
});
```

- [ ] **Step 2: Run** `npx ng test --no-watch --include src/app/content/image-loader.spec.ts` → FAIL (not exported).

- [ ] **Step 3: Implement** `export const pixelSrc = (src: string): string => src.replace(/\.jpg$/, '-40.jpg');` and create the variants: `sips -Z 40 public/images/work/apexflow.jpg --out public/images/work/apexflow-40.jpg` (same for ice-friends-breaker).

Work list: wrap the image in `<div class="media">` with, after the `img.shot`,

```html
<img class="pixels" [src]="pixelSrc(image.src)" alt="" aria-hidden="true" loading="lazy" decoding="async" [width]="image.width" [height]="image.height" />
```

Styles:

```scss
.media { position: relative; }
.pixels {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
  opacity: 0;
  pointer-events: none;
}
@media (hover: hover) and (prefers-reduced-motion: no-preference) {
  .project:hover .pixels,
  .project:focus-within .pixels {
    animation: depixelate 480ms steps(4, end);
  }
}
@keyframes depixelate {
  from { opacity: 1; }
  to { opacity: 0; }
}
```

Keep `.media` inheriting whatever grid placement and border `.shot` has today (move those rules to `.media`).

- [ ] **Step 4: e2e** (append to `e2e/motion.spec.ts`)

```ts
test('hovering a project plays the pixel animation once', async ({ page }) => {
  await page.goto('/en/');
  const project = page.locator('#work .project').first();
  await project.hover();
  expect(await project.locator('.pixels').evaluate((el) => getComputedStyle(el).animationName)).toBe('depixelate');
  expect(await project.locator('.pixels').evaluate((el) => (el as HTMLImageElement).naturalWidth || 'pending')).not.toBe(0);
});
```

- [ ] **Step 5: Run** `npx ng test --no-watch && npm run lint && npm run build && npx playwright test e2e/motion.spec.ts e2e/pages.spec.ts --project=chromium` → PASS.

- [ ] **Step 6: Commit** — `feat: pixelate project images on hover`

---

### Task 6: Cheap user-facing fixes from earlier reviews

**Files:**
- Modify: `src/app/app.routes.ts`, `netlify.toml`, `src/app/pages/case-study/case-study.ts`, `src/app/core/i18n/language-switch.ts` (only if its test fails)
- Test: `e2e/i18n.spec.ts`, `e2e/pages.spec.ts`

- [ ] **Step 1: Failing e2e tests**

```ts
// e2e/pages.spec.ts
test('an unknown URL shows the not-found page and keeps the URL', async ({ page }) => {
  await page.goto('/en/');
  await page.evaluate(() => { history.pushState({}, '', '/en/nope'); dispatchEvent(new PopStateEvent('popstate')); });
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page).toHaveURL(/\/en\/nope$/);
});

test('a tall project image asks for the size it is shown at', async ({ page }) => {
  await page.goto('/en/work/ice-friends-breaker');
  await expect(page.locator('img.shot')).toHaveAttribute('sizes', '(min-width: 400px) 360px, 100vw');
});

// e2e/i18n.spec.ts
test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('the language switch already points at the same page', async ({ page }) => {
    await page.goto('/en/work/apexflow');
    await expect(page.locator('.language-switch')).toHaveAttribute('href', '/it/work/apexflow');
  });
});
```

- [ ] **Step 2: Run** `npm run build && npx playwright test e2e/pages.spec.ts e2e/i18n.spec.ts --project=chromium -g "unknown URL|tall project|already points"` → the first two FAIL; record whether the third fails.

- [ ] **Step 3: Implement**

- `app.routes.ts`: `{ path: '**', loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFound) }` (keep the `404` route: it is what gets prerendered).
- Case study image: `[sizes]="image.height > image.width ? '(min-width: 400px) 360px, 100vw' : '(min-width: 1024px) 960px, 100vw'"`.
- `netlify.toml`, before the final `/*` 404 rule:

```toml
[[redirects]]
  from = "/*"
  to = "/it/404/index.html"
  status = 404
  conditions = { Language = ["it"] }
```

- Language switch, only if its test failed: derive the initial value from the document location (`this.doc.location.pathname` minus the `/<locale>` prefix) instead of `router.url`.

- [ ] **Step 4: Run** the same command → PASS; then `npx ng test --no-watch && npm run lint`.

- [ ] **Step 5: Commit** — `fix: keep unknown URLs, size tall images and serve the Italian 404 to Italian browsers`

---

### Task 7: Automated checks for the manual WCAG items

**Files:**
- Create: `e2e/a11y.spec.ts`

- [ ] **Step 1: Write the tests**

```ts
import { expect, test } from '@playwright/test';

// WCAG 1.4.12: these spacings must not hide or clip text
const TEXT_SPACING = '* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }';

for (const path of ['/en/', '/it/work/apexflow']) {
  test(`${path} survives WCAG text spacing without overflow`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto(path);
    await page.addStyleTag({ content: TEXT_SPACING });
    const clipped = await page.evaluate(() => {
      const out: string[] = [];
      for (const el of document.querySelectorAll<HTMLElement>('main h1, main h2, main h3, main p, main a, main li, header a, header button')) {
        const style = getComputedStyle(el);
        const hides = style.overflow === 'hidden' || style.overflowX === 'hidden' || style.overflowY === 'hidden';
        if (hides && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)) out.push(el.outerHTML.slice(0, 80));
      }
      return out;
    });
    expect(clipped).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('keyboard focus is always visible and never hidden by the header', async ({ page }) => {
  await page.goto('/en/');
  const header = await page.locator('header').boundingBox();
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return null;
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return { tag: el.tagName, inHeader: !!el.closest('header'), outline: s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2, top: r.top, bottom: r.bottom };
    });
    if (!info) continue;
    expect(info.outline, `${info.tag} #${String(i)} has a visible focus ring`).toBe(true);
    if (!info.inHeader && header) expect(info.bottom, `${info.tag} #${String(i)} is not under the header`).toBeGreaterThan(header.y + header.height);
  }
});
```

If the header is not sticky, `header.y + header.height` is its static position at the top: after scrolling, `info.bottom` stays positive and the assertion is about the sticky case only. Read `site-header.ts` first; if it is not sticky, change the check to `info.bottom > 0 && info.top < innerHeight`.

- [ ] **Step 2: Run** `npx playwright test e2e/a11y.spec.ts --project=chromium --project=firefox`
Expected: PASS. A failure here is a real accessibility bug: fix the component (TDD — the test is already red), not the test.

- [ ] **Step 3: Commit** — `test: check text spacing and keyboard focus visibility`

---

### Task 8: Plan close — full verification

- [ ] **Step 1:** `npm run lint && npx ng test --no-watch && npm run test:scripts && npm run build` → all green, budget line under 150 KB.
- [ ] **Step 2:** `npm run e2e > $WS/e2e.log 2>&1; tail -5 $WS/e2e.log` → all pass.
- [ ] **Step 3:** `npm run lhci > $WS/lhci.log 2>&1; tail -20 $WS/lhci.log` → assertions pass.
- [ ] **Step 4:** Push `v2` and confirm CI is green (`gh run watch`).
- [ ] **Step 5:** Final whole-branch review of this plan's range (most capable model), one fix pass, ledger, delete the workspace.
