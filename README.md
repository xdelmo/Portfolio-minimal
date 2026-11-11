# Emanuele Del Monte — Portfolio

[![Netlify Status](https://api.netlify.com/api/v1/badges/fdf854ce-9fd0-442d-8e79-9cedb4bd8100/deploy-status)](https://app.netlify.com/sites/emanueledelmonte/deploys)

The source of [www.emanueledelmonte.it](https://www.emanueledelmonte.it): a bilingual (English and Italian) portfolio built with Angular 22, fully prerendered to static HTML and hosted on Netlify.

## Run it

Needs Node 24 (see `.nvmrc`).

```bash
nvm use
npm ci
npm start            # both dev servers, open http://localhost:4200
npm run start:it     # Italian dev server only
npm run build        # both locales, prerendered, into dist/portfolio/browser
npm run e2e          # Playwright against the build
```

Other checks: `npm run verify:quick` (lint, unit and script tests in about a minute), `npm run lint`, `npx ng test --no-watch`, `npm run test:scripts`, `npm run lhci`, `npm run verify:deploy -- <url>`.

`npm start` runs both dev servers: open http://localhost:4200; `/it/` is proxied from port 4201, so the language switch works.

## Handbook

The technical handbook (in Italian: architecture, technical decisions, developer guide) lives in `handbook/` and is published at https://xdelmo.github.io/Portfolio-minimal/. Run it locally with `python3 -m venv .venv && .venv/bin/pip install -r handbook/requirements.txt && .venv/bin/mkdocs serve`.

## What changed

The design spec keeps a dated list of changes: [docs/superpowers/specs/2026-10-03-portfolio-v2-design.md](docs/superpowers/specs/2026-10-03-portfolio-v2-design.md), section 17. Each plan in `docs/superpowers/plans/` records what it built.

## How it is built

- **Two locale builds** with `@angular/localize`. Long content lives in `src/app/content/content.{en,it}.ts`; UI strings in `src/locale/messages.it.xlf`.
- **Static prerender** of every page, standalone components, signals and zoneless change detection; Three.js loads later through `@defer`, and each language's content is its own lazy chunk, so the initial JavaScript stays under 150 KB gzip (the build fails above it). Project images and the contact photo are WebP with a half-width copy for `srcset`.
- **Pixel cloud**: the hero draws a cloud of pastel pixels on a canvas from pure, unit-tested functions; it drifts with the wind on the seam grid round a soft clearing that follows the headline, composes once the intro lifts, pulls back from the pointer and ripples on tap. It pauses offscreen and becomes a still picture with reduced motion.
- **Two voices**: Instrument Sans carries the text, Instrument Serif italic the curious half of the headline and the About statement (preloaded only where it is used); prose runs at about 75 characters a line with no word alone on the last one.
- **Motion**: GSAP, ScrollTrigger and SplitText load as a lazy chunk after hydration. A once-per-session intro on every screen, titles that rise line by line, a hero that grows with scroll, a header that hides on scroll down, project pictures whose arrow button the cursor snaps to and which grows into a View pill on hover, a pinned experience deck of jobs (oldest first, ending on the current one) under a pixel chapter track that fills with it and jumps to a job on click, tool levels as rows where the type size is the level (what I use every day, what runs in production, side projects), coloured section bands, a contact band that widens to full bleed. Pins and pointer effects need a 1024px screen with hover; with reduced motion GSAP is not even loaded.
- **A site with a life of its own**: a pixel trails the cursor and buttons lean towards it, the moai breathes, turns its head towards the mouse and follows it with pixel pupils, blows a pink bubble of gum on a double click or double tap and speaks a stone's few words in a pixel bubble (a few gags about the rest of the site, «five more minutes» when woken), peeks out from behind "closely" in the hero lede on hover, menu links scramble on hover. One header button pauses all automatic motion (WCAG 2.2.2). Switching language drops a full-screen curtain with the new language's name, which lifts on the other side (the inline script in `src/index.html` starts the new page covered). The favicon is the home's moai seen from the front (`public/favicon.svg`, with `.ico`, `apple-touch-icon.png` and the web app manifest's icons, maskable one included, rendered from it).
- **The About in numbers**: a row of big figures, only true facts, that count up as they scroll in.
- **A pixel thread**: on the home page an accent line grows down the left margin with the scroll and lights a node at each section; the coloured bands grow a crumbling seam of pixels above their edge, which crumbles away again as it scrolls out under the header (one `PixelDissolve` component, a few SVG paths each). On phones the pixel field opens the page, experience entries pile up as sticky cards, the tool levels step in as rows and a sideways swipe turns the moai. The About opens with one statement that lights up word by word.
- **Press start**: the Konami code (↑ ↑ ↓ ↓ ← → ← → B A), five quick taps on the logo or the "Press start" key in the footer opens a player card: class, level, experience points to the next role and three achievements drawn as 16 × 16 pixel items. A native modal in a lazy chunk (`src/app/game/`).
- **Voxel moai**: a Three.js `InstancedMesh` loaded only when it scrolls into view; on desktop it also stands in the bottom-right corner of every other page (phones and tablets meet it only on the home). A prerendered still image takes its place with reduced motion, a data saver (`prefers-reduced-data`), missing WebGL or a failed download.
- **Forced colours**: in Windows High Contrast the rules, markers and pixel seams keep visible system colours.
- **Search and AI agents**: JSON-LD graph per page, sitemap with hreflang, `llms.txt` and a Markdown copy of every page generated from the same content files, Open Graph image per page and language.
- **Netlify**: language redirect on `/` (with the `nf_lang` cookie from the language switch), per-locale 404s, legacy Gatsby URLs, and a generated `_redirects` that serves case studies at their canonical URL without a trailing-slash 301. Pull request preview: `https://deploy-preview-<n>--emanueledelmonte.netlify.app`.
- **Privacy**: no analytics, no third-party scripts; `/privacy` (linked from the footer, `noindex`) lists exactly what the browser keeps (the `nf_lang` cookie, the theme, three session entries). Update it before adding any analytics.
- **Quality gates**: strict ESLint, Vitest, Playwright with axe (WCAG 2.2 AA, both themes) on Chromium, Firefox, WebKit and mobile emulation, Lighthouse CI.

The CV is available on request, not in this repository.
