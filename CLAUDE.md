# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- Node 24 (from `.nvmrc`; Angular 22 needs ≥ 24.15). On this machine the Homebrew Node is not usable: prefix commands with `export PATH="$HOME/.local/node/current/bin:$PATH";`
- `npm start` — both dev servers: open http://localhost:4200 (English under `/en/`, Italian under `/it/` proxied from port 4201, so the language switch works); `npm run start:it` runs only the Italian one
- `npm run verify` — the CI gate locally (lint, unit, scripts, build, e2e), stops at the first failure. Run it before saying a task is done and judge it by its exit code, never by grepping the output (a grep once hid 3 lint errors). WebKit runs only in CI on this machine. The e2e (and so the `pre-push` hook) reuse any server already on port 4300, even one started by another worktree or session: check which folder it serves (`lsof -p $(lsof -ti :4300) | grep cwd`) before trusting a result
- The machine is a fanless MacBook Air: while iterating run only the affected test (one spec file, `--project=chromium`), keep the full `npm run verify` for the end, and never run two suites or builds at once (check `pgrep -fl "playwright|ng build|vitest"` first)
- `npm run build` — static prerender of both locales into `dist/portfolio/browser/{en,it}` + sitemap/robots; never `ng build --localize=en` for a quick check: it writes a layout without `en/` and the e2e server stops working
- `npm run lint` — ESLint strict (typescript-eslint strictTypeChecked + angular-eslint, template a11y), zero warnings allowed
- `npx ng test --no-watch` — unit tests (Vitest); one file: `npx ng test --no-watch --include src/app/core/theme/theme.spec.ts`
- `npm run e2e` — Playwright against the built site (run `npm run build` first); one test: `npx playwright test e2e/theme.spec.ts --project=chromium`
- `npm run lhci` — Lighthouse CI against the built site (mobile, performance ≥ 0.95, best of 3 runs). It serves `dist` statically, so `lighthouserc.json` lists case studies with a trailing slash (the slash-less URL would cost a redirect Netlify does not make)
- `npm run i18n:extract` — regenerate `src/locale/messages.xlf` (git-ignored, generated) after changing template strings, then add the units by hand to `messages.it.xlf` (the only tracked one)
- `npm run verify:deploy -- <url>` — checks redirects, 404s and the SEO/GEO files on a Netlify deploy (preview or production)
- `npm run test:scripts` — tests for the build scripts (`node --test scripts/*.test.mjs`)

## Git workflow

- Every feature or fix gets its own branch off `v2` (`feat/<topic>`, `fix/<topic>`), never a direct commit on `v2`.
- When `npm run verify` exits 0: push the branch, open a PR into `v2` with `gh pr create`, then `gh pr checks --watch --fail-fast` and merge it yourself with `gh pr merge --squash --delete-branch` only if that exits 0 (the user does not review PRs). A red CI is fixed on the branch first, never merged; a docs-only PR waits for its CI too.
- The `pre-push` hook in `.githooks/` (enabled by `npm install` through `prepare`) runs `npm run verify` and blocks the push when it fails. Never bypass it with `--no-verify`.
- A WebKit or iPhone failure cannot be reproduced here (macOS 14): `gh run download <run-id> -n reports` gets the failed run's `test-results`; a test with a `-retry1` folder failed twice, one without it passed on retry. Read the steps and their durations from `trace.zip` before changing anything, and fix the cause rather than rerunning until green.
- A CI failure that says "The job was not acquired by Runner" is GitHub's runners, not the code: `gh run rerun <id>`; it still is not a green CI.
- `v2` → `master` (going live) still needs the user's explicit yes.

## Architecture

Angular 22 (standalone, zoneless, signals), fully prerendered (`outputMode: "static"`, no Node server), deployed on Netlify. Spec: `docs/superpowers/specs/2026-10-03-portfolio-v2-design.md`; plans in `docs/superpowers/plans/` (each opens with its status); every change to the spec gets a row in its §17. Manual launch steps, open questions for the user and the cleanup only they can do: `docs/launch/launch-kit.md`.

- Two locale builds via `@angular/localize`: English is the template source language, Italian lives in `src/locale/messages.it.xlf` (missing translations fail the build). UI strings use explicit `@@ids`; long content comes from `src/app/content/content.{en,it}.ts`, picked by `LOCALE_ID` through the `CONTENT` token.
- Logic that can break lives in pure, unit-tested functions next to thin services: `core/theme/theme.ts`, `core/i18n/locale.ts`, `core/seo/seo.ts`.
- Theme: an inline script in `src/index.html` sets `data-theme` before first paint; `ThemeService` takes over after hydration. All colors are CSS variables in `src/styles/_tokens.scss`.
- Netlify (`netlify.toml`) does the language redirect on `/` (honouring the `nf_lang` cookie set by the language switch), the canonical-domain 301s, legacy Gatsby URLs and per-locale 404s. `scripts/postbuild.mjs` also writes `_redirects` (200 rewrites so case studies answer at their slash-less canonical URL). The Netlify UI must not have `@netlify/plugin-gatsby` installed: it fails every Angular deploy.
- Motion: GSAP (ScrollTrigger, SplitText) loads as a lazy chunk through `MOTION_LOADER`; the `[appMotion]` directive (`src/app/motion/motion-host.ts`) runs the effects in `src/app/motion/effects/` inside `gsap.matchMedia`, and does nothing with reduced motion. Pins and pointer effects are desktop only (≥ 1024px with hover). Use `gsap.set` + `.to()` for scrubbed tweens (a scrubbed `.from()` is not redrawn in Firefox after a refresh). E2E skip the intro through `e2e/fixtures.ts`. `MotionPause` (`src/app/motion/pause.ts`) is the one pause switch: Angular code injects it, GSAP effects use `watchPause()`. Effects that move elements GSAP also transforms go through CSS `translate` variables. `PixelDissolve` (`src/app/pixel-dissolve/`) draws the band seams; `effects/dissolve.ts` scrubs its `--p` (seams form as they scroll in and crumble as they rise to the header), `effects/thread.ts` drives the home's pixel thread.
- First paint: the LCP is the hero headline (text), and Lighthouse puts every request started before the first paint on its critical path. So `MOTION_LOADER` imports GSAP only `afterPaint()`, project images are never `priority` (the hero fills the first screen) and `index.preloadInitial` is off; Three.js (moai) and the player card are lazy chunks too.
- Easter egg: `src/app/game/game-trigger.ts` (app shell) opens the lazy player card on the Konami code, five taps on the logo, or a click on any `[data-press-start]` (the footer key, rendered only after hydration).
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
