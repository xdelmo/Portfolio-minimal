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
- **Pixel field**: the hero draws Emanuele's face in pixel art on a 2D canvas from pure, unit-tested functions; its pixels fly in and settle, the dots fade towards the edges and the coloured pixels twinkle at random. It pauses offscreen and becomes a still picture with reduced motion.
- **Motion**: GSAP, ScrollTrigger and SplitText load as a lazy chunk after hydration. A once-per-session intro (desktop only), titles that rise line by line, a hero that grows with scroll, project images that tilt toward the cursor, a pinned experience deck, stack orbs that gather on a ring and then float, coloured section bands, a contact band that widens to full bleed and a reading-progress bar. Pins and pointer effects need a 1024px screen with hover; with reduced motion GSAP is not even loaded.
- **A site with a life of its own**: the hero's pixel portrait (generated from the photo by `npm run portrait`), pastel orbs drift behind every page, a pixel trails the cursor and buttons lean towards it, the moai breathes and looks at the mouse, menu links scramble on hover. One header button pauses all automatic motion (WCAG 2.2.2). Switching language drops a full-screen curtain with the new language's name, which lifts on the other side (the inline script in `src/index.html` starts the new page covered). The favicon is the same pixel "e." (`public/favicon.svg`, with `.ico` and `apple-touch-icon.png` rendered from it).
- **Voxel moai**: a Three.js `InstancedMesh` loaded only when it scrolls into view, with a prerendered still image for reduced motion, missing WebGL or a failed download.
- **Search and AI agents**: JSON-LD graph per page, sitemap with hreflang, `llms.txt` and a Markdown copy of every page generated from the same content files, Open Graph image per page and language.
- **Netlify**: language redirect on `/` (with the `nf_lang` cookie from the language switch), per-locale 404s, legacy Gatsby URLs, and a generated `_redirects` that serves case studies at their canonical URL without a trailing-slash 301. Branch preview: `https://v2--emanueledelmonte.netlify.app`.
- **Quality gates**: strict ESLint, Vitest, Playwright with axe (WCAG 2.2 AA, both themes) on Chromium, Firefox, WebKit and mobile emulation, Lighthouse CI.

The CV is available on request, not in this repository.
