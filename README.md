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

Other checks: `npm run lint`, `npx ng test --no-watch`, `npm run test:scripts`, `npm run lhci`, `npm run verify:deploy -- <url>`.

`npm start` runs both dev servers: open http://localhost:4200; `/it/` is proxied from port 4201, so the language switch works.

## What changed

The design spec keeps a dated list of changes: [docs/superpowers/specs/2026-10-03-portfolio-v2-design.md](docs/superpowers/specs/2026-10-03-portfolio-v2-design.md), section 17. Each plan in `docs/superpowers/plans/` records what it built.

## How it is built

- **Two locale builds** with `@angular/localize`. Long content lives in `src/app/content/content.{en,it}.ts`; UI strings in `src/locale/messages.it.xlf`.
- **Static prerender** of every page, standalone components, signals and zoneless change detection; Three.js loads later through `@defer`, so the initial JavaScript stays under 150 KB gzip (the build fails above it).
- **Pixel field**: the hero draws an abstract field of pastel dots on a 2D canvas from pure, unit-tested functions, behind the title on desktop and above it on phones; the dots fade towards the edges, the coloured ones twinkle at random, step away from the pointer and ripple on tap. It pauses offscreen and becomes a still picture with reduced motion.
- **Motion**: GSAP, ScrollTrigger and SplitText load as a lazy chunk after hydration. A once-per-session intro (desktop only), titles that rise line by line, a hero that grows with scroll, project images that tilt toward the cursor, a pinned experience deck of jobs (oldest first, ending on the current one) under a pixel chapter track that fills with it and jumps to a job on click, tool rings that turn into place (what I use every day in the middle, what runs in production around it, side projects outside), coloured section bands, a contact band that widens to full bleed. Pins and pointer effects need a 1024px screen with hover; with reduced motion GSAP is not even loaded.
- **A site with a life of its own**: pastel orbs drift behind every page, a pixel trails the cursor and buttons lean towards it, the moai breathes, turns its head towards the mouse and follows it with pixel pupils, blows a pink bubble of gum on a double click or double tap, menu links scramble on hover. One header button pauses all automatic motion (WCAG 2.2.2). Switching language drops a full-screen curtain with the new language's name, which lifts on the other side (the inline script in `src/index.html` starts the new page covered). The favicon is the same pixel "e." (`public/favicon.svg`, with `.ico` and `apple-touch-icon.png` rendered from it).
- **A pixel thread**: on the home page an accent line grows down the left margin with the scroll and lights a node at each section; the coloured bands grow a crumbling seam of pixels above their edge, which crumbles away again as it scrolls out under the header (one `PixelDissolve` component, a few SVG paths each). On phones the pixel field opens the page, experience entries pile up as sticky cards, the tool levels step in as rows and a sideways swipe turns the moai. The About opens with one statement that lights up word by word.
- **Press start**: the Konami code (↑ ↑ ↓ ↓ ← → ← → B A), five quick taps on the logo or the "Press start" key in the footer opens a player card: class, level, experience points to the next role and three achievements drawn as 16 × 16 pixel items. A native modal in a lazy chunk (`src/app/game/`).
- **Voxel moai**: a Three.js `InstancedMesh` loaded only when it scrolls into view, with a prerendered still image for reduced motion, missing WebGL or a failed download.
- **Search and AI agents**: JSON-LD graph per page, sitemap with hreflang, `llms.txt` and a Markdown copy of every page generated from the same content files, Open Graph image per page and language.
- **Netlify**: language redirect on `/` (with the `nf_lang` cookie from the language switch), per-locale 404s, legacy Gatsby URLs, and a generated `_redirects` that serves case studies at their canonical URL without a trailing-slash 301. Branch preview: `https://v2--emanueledelmonte.netlify.app`.
- **Privacy**: no analytics, no third-party scripts; `/privacy` (linked from the footer, `noindex`) lists exactly what the browser keeps (the `nf_lang` cookie, the theme, three session entries). Update it before adding any analytics.
- **Quality gates**: strict ESLint, Vitest, Playwright with axe (WCAG 2.2 AA, both themes) on Chromium, Firefox, WebKit and mobile emulation, Lighthouse CI.

The CV is available on request, not in this repository.
