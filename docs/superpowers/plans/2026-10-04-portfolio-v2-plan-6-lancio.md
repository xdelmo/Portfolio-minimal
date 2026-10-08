# Portfolio v2 — Piano 6: Lancio — Implementation Plan

## Stato (2026-10-06): completato per la parte di codice (`npm run verify:deploy`, README). I passi manuali sono in `docs/launch/launch-kit.md`, e il merge su `master` aspetta il sì dell'utente.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the launch a checklist instead of an improvisation: one command verifies a Netlify deploy (redirects, 404s, SEO/GEO files), the repository explains the new site, and a launch kit holds the texts and manual checks that only Emanuele can do.

**Architecture:** `scripts/verify-deploy.mjs <base-url>` runs a table of HTTP expectations with `fetch` (`redirect: 'manual'`), so the same checks run against the branch preview and, after the merge, against production. The check runner is a pure function over an injected `fetch`, tested with a fake. Everything outward-facing (enabling branch deploys, Search Console, LinkedIn, the merge to `master`) stays with Emanuele and is listed in `docs/launch/launch-kit.md`.

**Tech Stack:** Node 24 (`fetch`, `node:test`), Netlify.

**Spec:** `docs/superpowers/specs/2026-10-03-portfolio-v2-design.md` (§8 off-site SEO, §9 identity alignment, §12 manual WCAG checks, §13 manual device test, §14 deploy)

## Global Constraints

- Every command runs with `export PATH="$HOME/.local/node/current/bin:$PATH";` in front.
- `npm run lint` with zero warnings; `npm run test:scripts` green.
- Never log in to LinkedIn, never change repository visibility, never merge to `master` or touch Netlify settings without Emanuele's explicit yes.
- The CV is not published anywhere; texts say "CV available on request".

## Review Focus

1. Netlify answering a redirect with 301 instead of the expected 302 for the language root (or the reverse) → the check must compare the status exactly, because a cached 301 on `/` would pin every visitor to one language.
2. A check URL that redirects to the right place with a different trailing slash (`/it` vs `/it/`) → compare the resolved `Location` against the expected absolute URL, not a substring.
3. A deploy that is still building or returns HTML for `/llms.txt` (SPA fallback) → content checks must look at the body, not only the status.
4. A network error on one URL → the script reports that row as failed and still runs the rest, then exits non-zero.
5. The production domain redirecting `emanueledelmonte.it` → `www` → covered only after the merge; the kit lists it as a post-launch check.

---

### Task 1: One-command deploy verification

**Files:**
- Create: `scripts/verify-deploy.mjs`, `scripts/verify-deploy.test.mjs`
- Modify: `package.json` (`verify:deploy` script), `CLAUDE.md` (command line)

**Interfaces:**
- Produces: `CHECKS` (array of `{ name, path, headers?, status, location?, contains?, contentType? }`), `runChecks(base: string, fetchImpl: typeof fetch): Promise<{ name: string; ok: boolean; detail: string }[]>`.

- [ ] **Step 1: Write the failing tests** (`scripts/verify-deploy.test.mjs`)

```js
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CHECKS, runChecks } from './verify-deploy.mjs';

const BASE = 'https://preview.example';
const response = (status, { location, body = '', type = 'text/html' } = {}) =>
  new Response(status === 301 || status === 302 ? null : body, { status, headers: { ...(location ? { location } : {}), 'content-type': type } });

test('a row passes when status, location, content type and body match', async () => {
  const fetchImpl = async () => response(302, { location: `${BASE}/it/` });
  const [row] = await runChecks(BASE, fetchImpl, [{ name: 'it root', path: '/', status: 302, location: '/it/' }]);
  assert.equal(row.ok, true);
});

test('the status must match exactly and the location must be the same absolute URL', async () => {
  const wrongStatus = await runChecks(BASE, async () => response(301, { location: `${BASE}/it/` }), [{ name: 'a', path: '/', status: 302, location: '/it/' }]);
  assert.equal(wrongStatus[0].ok, false);
  const wrongSlash = await runChecks(BASE, async () => response(302, { location: `${BASE}/it` }), [{ name: 'b', path: '/', status: 302, location: '/it/' }]);
  assert.equal(wrongSlash[0].ok, false);
  const relative = await runChecks(BASE, async () => response(302, { location: '/it/' }), [{ name: 'c', path: '/', status: 302, location: '/it/' }]);
  assert.equal(relative[0].ok, true);
});

test('content checks read the body and the content type', async () => {
  const html = await runChecks(BASE, async () => response(200, { body: '<!doctype html>' }), [{ name: 'llms', path: '/llms.txt', status: 200, contains: '# Emanuele Del Monte' }]);
  assert.equal(html[0].ok, false);
  const md = await runChecks(BASE, async () => response(200, { body: '# x', type: 'text/plain' }), [{ name: 'md', path: '/en/index.md', status: 200, contentType: 'text/markdown' }]);
  assert.equal(md[0].ok, false);
});

test('a network error fails its row and the others still run', async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls++;
    if (calls === 1) throw new Error('ECONNRESET');
    return response(200, { body: 'ok' });
  };
  const rows = await runChecks(BASE, fetchImpl, [{ name: 'a', path: '/a', status: 200 }, { name: 'b', path: '/b', status: 200 }]);
  assert.deepEqual(rows.map((r) => r.ok), [false, true]);
  assert.match(rows[0].detail, /ECONNRESET/);
});

test('the default table covers language, legacy, 404 and GEO rows', () => {
  const names = CHECKS.map((c) => c.name).join('\n');
  for (const part of ['it-IT', 'it-CH', 'de-DE', 'nf_lang', '/privacy', '/it/work/apexflw', 'llms.txt', 'index.md', 'sitemap.xml', 'og image']) {
    assert.ok(names.includes(part), part);
  }
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test scripts/verify-deploy.test.mjs`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement** (`scripts/verify-deploy.mjs`)

```js
// Checks a Netlify deploy against the redirect, 404 and SEO/GEO rules (spec §8, §9, §14).
// Usage: npm run verify:deploy -- https://v2--<site>.netlify.app
import { argv, exit } from 'node:process';
import { URL } from 'node:url';

const it = { 'accept-language': 'it-IT,it;q=0.9,en;q=0.8' };

export const CHECKS = [
  { name: '/ with it-IT goes to /it/', path: '/', headers: it, status: 302, location: '/it/' },
  { name: '/ with it-CH goes to /it/', path: '/', headers: { 'accept-language': 'it-CH' }, status: 302, location: '/it/' },
  { name: '/ with de-DE goes to /en/', path: '/', headers: { 'accept-language': 'de-DE,de;q=0.9' }, status: 302, location: '/en/' },
  { name: '/ with it-IT and nf_lang=en goes to /en/', path: '/', headers: { ...it, cookie: 'nf_lang=en' }, status: 302, location: '/en/' },
  ...['/privacy', '/imprint', '/blog/x', '/my-first-article'].map((path) => ({ name: `legacy ${path} goes to /it/`, path, status: 301, location: '/it/' })),
  { name: 'English home', path: '/en/', status: 200, contains: '<html lang="en"' },
  { name: 'Italian case study', path: '/it/work/apexflow', status: 200, contains: 'ApexFlow' },
  { name: 'wrong slug /en/work/apexflw is a 404', path: '/en/work/apexflw', status: 404, contains: "This page doesn" },
  { name: 'wrong slug /it/work/apexflw is an Italian 404', path: '/it/work/apexflw', status: 404, contains: 'Questa pagina non esiste' },
  { name: 'unknown root URL with it-IT is an Italian 404', path: '/nope', headers: it, status: 404, contains: 'Questa pagina non esiste' },
  { name: 'sitemap.xml', path: '/sitemap.xml', status: 200, contains: '<urlset' },
  { name: 'robots.txt allows AI crawlers', path: '/robots.txt', status: 200, contains: 'ClaudeBot' },
  { name: 'llms.txt', path: '/llms.txt', status: 200, contains: '# Emanuele Del Monte' },
  { name: 'index.md is served as Markdown', path: '/en/index.md', status: 200, contentType: 'text/markdown', contains: '# Emanuele Del Monte' },
  { name: 'og image for the Italian home', path: '/it/og/it-home.png', status: 200, contentType: 'image/png' },
];

async function check(base, fetchImpl, c) {
  try {
    const res = await fetchImpl(new URL(c.path, base), { redirect: 'manual', headers: c.headers ?? {} });
    const problems = [];
    if (res.status !== c.status) problems.push(`status ${String(res.status)}, expected ${String(c.status)}`);
    if (c.location) {
      const got = res.headers.get('location');
      if (!got || new URL(got, base).href !== new URL(c.location, base).href) problems.push(`location ${String(got)}, expected ${c.location}`);
    }
    if (c.contentType && !(res.headers.get('content-type') ?? '').startsWith(c.contentType)) problems.push(`content-type ${String(res.headers.get('content-type'))}`);
    if (c.contains && !(await res.text()).includes(c.contains)) problems.push(`body lacks "${c.contains}"`);
    return { name: c.name, ok: problems.length === 0, detail: problems.join('; ') };
  } catch (error) {
    return { name: c.name, ok: false, detail: String(error) };
  }
}

export async function runChecks(base, fetchImpl = fetch, checks = CHECKS) {
  const rows = [];
  for (const c of checks) rows.push(await check(base, fetchImpl, c));
  return rows;
}

if (import.meta.url === `file://${argv[1]}`) {
  const base = argv[2];
  if (!base) {
    console.error('Usage: npm run verify:deploy -- <base-url>');
    exit(2);
  }
  const rows = await runChecks(base);
  for (const r of rows) console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${r.name}${r.detail ? ` — ${r.detail}` : ''}`);
  exit(rows.every((r) => r.ok) ? 0 : 1);
}
```

`package.json`: `"verify:deploy": "node scripts/verify-deploy.mjs"`. `CLAUDE.md` Commands: `- npm run verify:deploy -- <url>` — checks redirects, 404s and SEO/GEO files on a Netlify deploy.

- [ ] **Step 4: Run to verify it passes**

Run: `npm run test:scripts && npm run lint`
Expected: all pass.

- [ ] **Step 5: Smoke-run against the local build** (`http-server` on 4301 has no Netlify redirects, so only the file rows can pass)

Run: `npm run verify:deploy -- http://localhost:4301 | grep -E "^ok" | wc -l`
Expected: at least the 7 file rows (`English home`, `Italian case study`, sitemap, robots, llms, og image; `index.md` may fail on content type because http-server is not Netlify).

- [ ] **Step 6: Commit** — `feat: add a one-command check for Netlify deploys`

---

### Task 2: README for the new site

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace the Gatsby README** with an English README: one-paragraph description (bilingual Angular 22 portfolio, static prerender, Netlify), a "Run it" block (`nvm use`, `npm ci`, `npm start`, `npm run build`, `npm run e2e`), a short "How it is built" list (two locale builds, pixel field canvas, voxel moai with Three.js and its still fallback, JSON-LD/llms.txt/Markdown from the content files, OG images, quality gates: strict ESLint, Vitest, Playwright + axe, Lighthouse CI), and a link to the live site. Keep the Netlify badge. No CV, no personal data beyond what the site shows.

- [ ] **Step 2: Check** every command in the README exists in `package.json` (`grep` each script name).

- [ ] **Step 3: Commit** — `docs: describe the new site in the README`

---

### Task 3: Launch kit

**Files:**
- Create: `docs/launch/launch-kit.md` (Italian, for Emanuele)

- [ ] **Step 1: Write the kit** with these sections, each a checklist:
  1. **Anteprima** — enable the `v2` branch deploy on Netlify (path from Plan 1 Task 8 Step 1), then `npm run verify:deploy -- https://v2--<site>.netlify.app`; if `it-IT` lands on `/en/`, change the condition to `Language = ["it", "it-IT", "it-CH"]`.
  2. **Verifica manuale WCAG 2.2 AA** (spec §12): full keyboard run, VoiceOver on macOS and iOS, zoom 200%, text spacing bookmarklet, `prefers-reduced-motion`, both themes, both languages.
  3. **Dispositivi veri** (spec §13): one iPhone and one Android — scroll, moai, pixel field pause, theme, language, links.
  4. **Lancio** — Emanuele says yes, then merge `v2` into `master` (Netlify builds production), then `npm run verify:deploy -- https://www.emanueledelmonte.it` plus `curl -sI https://emanueledelmonte.it/` → 301 to `www`.
  5. **Fuori dal sito** (spec §8–§9): Google Search Console and Bing Webmaster (domain property, submit `https://www.emanueledelmonte.it/sitemap.xml`); LinkedIn headline and the first line of About, written to match the site (`Frontend Engineer · Angular, Signals, RxJS · IPS S.p.A. · Latina`) with the site link; a GitHub profile README draft (in the kit, in English) with the same name, role, city and links; the website link in the README of each public repo.
  6. **Dopo qualche settimana** (spec §9): ask ChatGPT, Perplexity and Claude with web search "Who is Emanuele Del Monte, frontend engineer?" and note what they get right.
  7. **Domande aperte** carried from earlier plans: the languages line in "At a glance"; the official job title (`Frontend Engineer` vs `Software Engineer, Frontend Specialist`); two Telegram ids in a public repo's `.env.example` that may be real.

- [ ] **Step 2: Commit** — `docs: add the launch kit`

---

### Task 4: Preview verification (needs Emanuele)

- [ ] **Step 1:** Ask Emanuele to enable the `v2` branch deploy and share the preview URL.
- [ ] **Step 2:** `npm run verify:deploy -- <preview-url>` → all rows `ok`. Fix `netlify.toml` for any failure (TDD: the failing row is the red test), push, re-run.
- [ ] **Step 3:** Lighthouse on the preview: `npx lhci collect --url=<preview-url>/en/ --url=<preview-url>/it/work/apexflow && npx lhci assert` → pass.

### Task 5: Merge (needs Emanuele's explicit yes)

- [ ] **Step 1:** Ask for the go-ahead with a summary of what changes on production (new site, URLs, redirects).
- [ ] **Step 2:** On yes: open a PR `v2` → `master`, wait for CI, merge; then `npm run verify:deploy -- https://www.emanueledelmonte.it`.
