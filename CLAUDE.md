# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- Node 24 (from `.nvmrc`; Angular 22 needs ≥ 24.15). On this machine the Homebrew Node is not usable: prefix commands with `export PATH="$HOME/.local/node/current/bin:$PATH";`
- `npm start` — dev server (English build) at http://localhost:4200
- `npm run start:it` — dev server, Italian build
- `npm run build` — static prerender of both locales into `dist/portfolio/browser/{en,it}` + sitemap/robots
- `npx ng test --no-watch` — unit tests (Vitest); one file: `npx ng test --no-watch --include src/app/core/theme/theme.spec.ts`
- `npm run e2e` — Playwright against the built site (run `npm run build` first); one test: `npx playwright test e2e/theme.spec.ts --project=chromium`
- `npm run lhci` — Lighthouse CI against the built site
- `npm run i18n:extract` — regenerate `src/locale/messages.xlf` after changing template strings, then update `messages.it.xlf`
- `node --test scripts/` — tests for the build scripts

## Architecture

Angular 22 (standalone, zoneless, signals), fully prerendered (`outputMode: "static"`, no Node server), deployed on Netlify. Spec: `docs/superpowers/specs/2026-10-03-portfolio-v2-design.md`; plans in `docs/superpowers/plans/`.

- Two locale builds via `@angular/localize`: English is the template source language, Italian lives in `src/locale/messages.it.xlf` (missing translations fail the build). UI strings use explicit `@@ids`; long content comes from `src/app/content/content.{en,it}.ts`, picked by `LOCALE_ID` through the `CONTENT` token.
- Logic that can break lives in pure, unit-tested functions next to thin services: `core/theme/theme.ts`, `core/i18n/locale.ts`, `core/seo/seo.ts`.
- Theme: an inline script in `src/index.html` sets `data-theme` before first paint; `ThemeService` takes over after hydration. All colors are CSS variables in `src/styles/tokens.css`.
- Netlify (`netlify.toml`) does the language redirect on `/` (honouring the `nf_lang` cookie set by the language switch), the canonical-domain 301s, legacy Gatsby URLs and per-locale 404s.
- `scripts/postbuild.mjs` builds `sitemap.xml` and `robots.txt` at the publish root from the prerendered pages' canonical/hreflang tags.

## Conventions

- Site content is bilingual (English source, Italian translation).
- Visual system (8px pixel grid, Instrument Sans, no eyebrow labels or mono metadata) is described in plan 1, section "Sistema visivo".
- The old Gatsby site lives on `master`; its images can be recovered with `git show master:content/images/<file>`.
