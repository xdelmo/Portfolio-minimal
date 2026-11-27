---
title: Architecting this portfolio with Angular 22
description: Zoneless static prerendering on Netlify, after-paint script loading, lazy GSAP and Three.js chunks, and Lighthouse CI holding mobile performance at 95+.
date: 2026-11-12
---
Most developer portfolios reach for Astro or plain HTML; Angular is usually written off as too heavy outside enterprise dashboards.

I built this site with Angular 22 to test that assumption: static prerendering, no Zone.js, Lighthouse CI mobile performance at 95 or above, and WCAG 2.2 AA accessibility.

## Static prerendering and a zoneless architecture

No Node.js runtime executes in production. By setting `outputMode: "static"` in `angular.json`, the Angular build system prerenders every route into flat HTML files at compile time.

Combined with `@angular/localize`, the build outputs two autonomous directory trees:

- `dist/portfolio/browser/en/` for the English locale
- `dist/portfolio/browser/it/` for the Italian locale

Netlify serves these static assets directly from its global CDN. An `nf_lang` cookie, set whenever a visitor toggles the language switch in the header, is evaluated at the edge by `netlify.toml` to redirect the root `/` to the appropriate language folder.

Furthermore, the entire application runs without `zone.js`. The architecture relies exclusively on Angular Signals and native reactivity:

```ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withComponentInputBinding(),
      withViewTransitions({ skipInitialTransition: true }),
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }),
      withChunkReload(),
    ),
    provideClientHydration(withEventReplay(), withI18nSupport()),
    provideContent(),
  ],
};
```

Without Zone.js overhead, change detection only triggers when signals genuinely change value. This eliminates browser event monkey-patching and shrinks the initial JavaScript footprint.

## First paint before client scripts

On mobile devices, the most critical user experience metrics are Largest Contentful Paint (LCP) and Total Blocking Time (TBT). On this site, the LCP element is the primary hero headline—pure text.

By default, Angular injects `<script type="module">` tags into the HTML document. Browsers download and evaluate these bundles immediately, competing with the initial layout and font rendering.

To optimize the critical path, a postbuild step (`scripts/after-paint.mjs`) swaps the eager module tags for an inline loader executed after the initial animation frame:

```html
<script>
  requestAnimationFrame(() => {
    setTimeout(() => {
      // Asynchronously load Angular entry modules
    }, 0);
  });
</script>
```

This dropped First Contentful Paint from 1.9s down to 1.2s on Lighthouse mobile. Visitors see the styled page right away, while hydration and event replay attach after the first paint.

## Interactive motion without bundle weight

I wanted the site to feel alive: smooth scroll, subtle parallax accents, text reveals, and an interactive isometric voxel moai in the corner. However, third-party libraries like GSAP (ScrollTrigger, SplitText, ScrollSmoother) or Three.js easily bloat bundle size if bundled naively.

The solution relies on layered lazy loading:

1. **Dedicated chunks**: Neither GSAP nor Three.js is present in the main bundle.
2. **Sequential loading via `MOTION_LOADER`**: The token waits until after the first paint, imports GSAP and each plugin one at a time, and `MotionHost` starts each effect in its own `setTimeout` task so startup never becomes one long task.
3. **User preferences first**: With `prefers-reduced-motion: reduce`, GSAP never loads at all. ScrollSmoother runs only on `(hover: hover)` and `(pointer: fine)`, and desktop pins require at least `1024px` with hover, leaving touch devices on native scroll.

Between home sections, stepped seams drawn as layered SVG paths (`PixelDissolve`) form and dissolve synchronously with scroll progress via a CSS variable (`--p`):

```scss
.seam {
  position: absolute;
  inset-inline: calc(50% - 50vw);
  height: var(--space-6); // 48px: three rows of 16px cells
}
```

Updating a single CSS custom property moves the seams without triggering layout recalculations.

## Continuous automated verification

Maintaining high performance and accessibility requires ongoing discipline. To prevent regressions, every pull request passes through an automated local and CI verification pipeline before landing:

- `npm run lint`: strict ESLint validation with `typescript-eslint` in strictTypeChecked mode and `angular-eslint`, allowing zero warnings.
- `npx ng test --no-watch`: Vitest unit tests covering core services and state logic.
- `npm run lhci`: three mobile Lighthouse CI passes enforcing a performance threshold of 0.95 or higher.
- `npm run e2e`: Playwright end-to-end tests including automated axe accessibility scans for WCAG 2.2 AA in both light and dark themes.
- `npm run e2e:webkit`: Playwright running WebKit tests inside an isolated Linux container to catch cross-browser layout quirks.

Angular 22’s static prerendering and zoneless reactivity hold up well on a content-first site, as long as third-party motion stays out of the initial bundle and CI enforces the performance and accessibility floor.
