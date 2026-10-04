# Emanuele Del Monte — Portfolio

[![Netlify Status](https://api.netlify.com/api/v1/badges/fdf854ce-9fd0-442d-8e79-9cedb4bd8100/deploy-status)](https://app.netlify.com/sites/emanueledelmonte/deploys)

The source of [www.emanueledelmonte.it](https://www.emanueledelmonte.it): a bilingual (English and Italian) portfolio built with Angular 22, fully prerendered to static HTML and hosted on Netlify.

## Run it

Needs Node 24 (see `.nvmrc`).

```bash
nvm use
npm ci
npm start            # English dev server on http://localhost:4200
npm run start:it     # Italian dev server
npm run build        # both locales, prerendered, into dist/portfolio/browser
npm run e2e          # Playwright against the build
```

Other checks: `npm run lint`, `npx ng test --no-watch`, `npm run test:scripts`, `npm run lhci`.

## How it is built

- **Two locale builds** with `@angular/localize`. Long content lives in `src/app/content/content.{en,it}.ts`; UI strings in `src/locale/messages.it.xlf`.
- **Static prerender** of every page, standalone components, signals and zoneless change detection; Three.js loads later through `@defer`, so the initial JavaScript stays under 150 KB gzip (the build fails above it).
- **Pixel field**: the hero's "edm." is drawn on a 2D canvas from pure, unit-tested functions, paused offscreen and replaced by a still picture with reduced motion.
- **Voxel moai**: a Three.js `InstancedMesh` loaded only when it scrolls into view, with a prerendered still image for reduced motion, missing WebGL or a failed download.
- **Search and AI agents**: JSON-LD graph per page, sitemap with hreflang, `llms.txt` and a Markdown copy of every page generated from the same content files, Open Graph image per page and language.
- **Quality gates**: strict ESLint, Vitest, Playwright with axe (WCAG 2.2 AA, both themes) on Chromium, Firefox, WebKit and mobile emulation, Lighthouse CI.

The CV is available on request, not in this repository.
