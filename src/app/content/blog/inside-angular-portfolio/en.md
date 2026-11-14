---
title: Architecting this portfolio with Angular 22
description: Zoneless static prerendering, zero server runtime on Netlify, deferred GSAP motion, and canvas shaders, with Lighthouse CI holding mobile performance at 95 or more.
date: 2026-11-12
---
When choosing a tech stack for a personal developer portfolio in 2026, most engineers reach for Astro, Next.js, or plain static HTML. Angular is frequently typecast as an enterprise-only framework—powerful for complex internal dashboards, but too heavy and opinionated for a personal showcase.

I built this portfolio to prove the opposite: pushing Angular 22 toward a completely static, zoneless model driven by Signals, holding mobile performance at 95 or more on Lighthouse CI, and delivering rich interactive motion alongside strict WCAG 2.2 AA accessibility.

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

By default, Angular injects `<script type="module">` tags into the document head. Browsers download and evaluate these bundles immediately, competing with the initial layout and font rendering.

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

This dropped First Contentful Paint from 1.9s down to 1.2s on Lighthouse mobile. Visitors see a fully styled, typographically complete layout right away, while hydration and event handlers wire up seamlessly in the background without locking the main thread.

## Interactive motion without bundle weight

I wanted the site to feel alive: smooth scroll, subtle parallax accents, text reveals, and an interactive isometric voxel moai in the corner. However, third-party libraries like GSAP (ScrollTrigger, SplitText, ScrollSmoother) or Three.js easily bloat bundle size if bundled naively.

The solution relies on layered lazy loading:

1. **Dedicated chunks**: Neither GSAP nor Three.js is present in the main bundle.
2. **Sequential MOTION_LOADER**: The service imports GSAP and each required plugin one by one across separate microtasks. Spreading initialization prevents long CPU execution tasks during startup.
3. **User preferences first**: When `prefers-reduced-motion: reduce` is enabled or a touch screen (`pointer: coarse`) is in use, ScrollSmoother and pinned parallax effects are disabled entirely, letting native browser scrolling take over.

Between home sections, canvas-rendered stepped seams (`PixelDissolve`) form and dissolve synchronously with scroll progress via a CSS variable (`--p`):

```scss
app-pixel-dissolve.seam {
  display: block;
  width: 100%;
  height: 24px;
}
```

The visual bands provide texture and structural rhythm without causing layout recalculations or frame drops.

## Continuous automated verification

Maintaining high performance and accessibility requires ongoing discipline. To prevent regressions, every pull request passes through an automated local and CI verification pipeline before landing:

- `npm run lint`: strict ESLint validation with `typescript-eslint` in strictTypeChecked mode and `angular-eslint`, allowing zero warnings.
- `npx ng test --no-watch`: Vitest unit tests covering core services and state logic.
- `npm run lhci`: three mobile Lighthouse CI passes enforcing a performance threshold of 0.95 or higher.
- `npm run e2e`: Playwright end-to-end tests including automated axe accessibility scans for WCAG 2.2 AA in both light and dark themes.
- `npm run e2e:webkit`: Playwright running WebKit tests inside an isolated Linux container to catch cross-browser layout quirks.

## Conclusion

Choosing Angular for a personal portfolio was not an arbitrary compromise—it was an opportunity to explore how modern Angular primitives perform when pushed to their limits.

Through zoneless signals, static prerendering, and disciplined asset scheduling, it delivers an experience that is fast, accessible, and engaging to navigate.
