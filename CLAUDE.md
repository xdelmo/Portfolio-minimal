# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- Node 24 (from `.nvmrc`; Angular 22 needs ≥ 24.15). On this machine the Homebrew Node is not usable: prefix commands with `export PATH="$HOME/.local/node/current/bin:$PATH";`
- `npm start` — both dev servers: open http://localhost:4200 (English under `/en/`, Italian under `/it/` proxied from port 4201, so the language switch works); `npm run start:it` runs only the Italian one
- `npm run verify` — the CI gate locally (lint, unit, scripts, build, e2e), stops at the first failure. Run it before saying a task is done and judge it by its exit code, never by grepping the output (a grep once hid 3 lint errors). WebKit runs only in CI on this machine. The e2e reuse any server already on port 4300: in a worktree, check `lsof -i :4300` first, or the tests run against another checkout's `dist`
- The machine is a fanless MacBook Air: while iterating run only the affected test (one spec file, `--project=chromium`), keep the full `npm run verify` for the end, and never run two suites or builds at once (check `pgrep -fl "playwright|ng build|vitest"` first)
- `npm run build` — static prerender of both locales into `dist/portfolio/browser/{en,it}` + sitemap/robots
- `npm run lint` — ESLint strict (typescript-eslint strictTypeChecked + angular-eslint, template a11y), zero warnings allowed
- `npx ng test --no-watch` — unit tests (Vitest); one file: `npx ng test --no-watch --include src/app/core/theme/theme.spec.ts`
- `npm run e2e` — Playwright against the built site (run `npm run build` first); one test: `npx playwright test e2e/theme.spec.ts --project=chromium`
- `npm run lhci` — Lighthouse CI against the built site
- `npm run i18n:extract` — regenerate `src/locale/messages.xlf` after changing template strings, then update `messages.it.xlf`
- `npm run verify:deploy -- <url>` — checks redirects, 404s and the SEO/GEO files on a Netlify deploy (preview or production)
- `npm run test:scripts` — tests for the build scripts (`node --test scripts/*.test.mjs`)

## Architecture

Angular 22 (standalone, zoneless, signals), fully prerendered (`outputMode: "static"`, no Node server), deployed on Netlify. Spec: `docs/superpowers/specs/2026-10-03-portfolio-v2-design.md`; plans in `docs/superpowers/plans/`.

- Two locale builds via `@angular/localize`: English is the template source language, Italian lives in `src/locale/messages.it.xlf` (missing translations fail the build). UI strings use explicit `@@ids`; long content comes from `src/app/content/content.{en,it}.ts`, picked by `LOCALE_ID` through the `CONTENT` token.
- Logic that can break lives in pure, unit-tested functions next to thin services: `core/theme/theme.ts`, `core/i18n/locale.ts`, `core/seo/seo.ts`.
- Theme: an inline script in `src/index.html` sets `data-theme` before first paint; `ThemeService` takes over after hydration. All colors are CSS variables in `src/styles/_tokens.scss`.
- Netlify (`netlify.toml`) does the language redirect on `/` (honouring the `nf_lang` cookie set by the language switch), the canonical-domain 301s, legacy Gatsby URLs and per-locale 404s. `scripts/postbuild.mjs` also writes `_redirects` (200 rewrites so case studies answer at their slash-less canonical URL). The Netlify UI must not have `@netlify/plugin-gatsby` installed: it fails every Angular deploy.
- Motion: GSAP (ScrollTrigger, SplitText) loads as a lazy chunk through `MOTION_LOADER`; the `[appMotion]` directive (`src/app/motion/motion-host.ts`) runs the effects in `src/app/motion/effects/` inside `gsap.matchMedia`, and does nothing with reduced motion. Pins and pointer effects are desktop only (≥ 1024px with hover). Use `gsap.set` + `.to()` for scrubbed tweens (a scrubbed `.from()` is not redrawn in Firefox after a refresh). E2E skip the intro through `e2e/fixtures.ts`. `MotionPause` (`src/app/motion/pause.ts`) is the one pause switch: Angular code injects it, GSAP effects use `watchPause()`. Effects that move elements GSAP also transforms go through CSS `translate` variables. The hero portrait is generated: `npm run portrait` after changing `public/images/emanuele.jpg`.
- `scripts/postbuild.mjs` builds `sitemap.xml` and `robots.txt` at the publish root from the prerendered pages' canonical/hreflang tags.

## Conventions

- Site content is bilingual (English source, Italian translation).
- No green anywhere in the palette (the user's brand colours are greys, the `--accent` blue family, lavender and peach).
- Styles are SCSS (`inlineStyleLanguage: scss`, `includePaths: [src]`); colors stay CSS custom properties because the theme switches them at runtime; use `@use 'styles/breakpoints' as bp;` and `@include bp.up(md)` for breakpoints.
- The whole site must meet WCAG 2.2 AA (spec §11): axe runs with WCAG tags in both themes in the e2e suite.
- Visual style directives live in the project skill `.claude/skills/edm-style/SKILL.md` (palette, type, 8px grid, stepped shapes, the living objects, motion rules): read it before any visual change. The original visual system is in plan 1, section "Sistema visivo".
- The old Gatsby site lives on `master`; its images can be recovered with `git show master:content/images/<file>`.
- Project images live in `public/images/work/` as JPEG: the original at full width plus a half-width copy named `<name>-<width/2>.jpg` (`workImageLoader` builds the `srcset` from them). Set `width`/`height` in both content files to the original size.
- Open Graph images are committed in `public/og/`: run `npm run og:images` after changing a title, a summary or the project list (the build fails if a page points at a missing one). The build also writes `llms.txt` and a Markdown copy of every page from the content files.
- Fonts: `src/styles/_fonts.scss` declares Instrument Sans from `@fontsource-variable` with `font-display: optional`, and `scripts/postbuild.mjs` injects a `<link rel="preload">` for the latin file into every page. Together they keep CLS at 0; do not switch back to the package CSS (it uses `swap`).
