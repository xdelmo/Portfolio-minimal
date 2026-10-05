import { IMAGE_LOADER, ViewportScroller } from '@angular/common';
import { ApplicationConfig, inject, provideBrowserGlobalErrorListeners, provideEnvironmentInitializer } from '@angular/core';
import { provideClientHydration, withEventReplay, withI18nSupport } from '@angular/platform-browser';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withViewTransitions,
} from '@angular/router';
import { routes } from './app.routes';
import { workImageLoader } from './content/image-loader';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      // only between pages of the app: the first navigation at hydration would cross-fade the page it just loaded
      withViewTransitions({ skipInitialTransition: true }),
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }),
    ),
    provideClientHydration(withEventReplay(), withI18nSupport()),
    { provide: IMAGE_LOADER, useValue: workImageLoader },
    // The router reaches an anchor with window.scrollTo: an instant jump that ignores the sticky header's scroll-padding.
    // scrollIntoView honours scroll-padding and scroll-margin, and glides unless the visitor asked for reduced motion.
    provideEnvironmentInitializer(() => {
      const scroller = inject(ViewportScroller);
      scroller.scrollToAnchor = (anchor) => {
        const target = document.getElementById(anchor);
        if (!target) return;
        const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
        target.scrollIntoView({ behavior: reduce ? 'instant' : 'smooth' });
        target.focus({ preventScroll: true });
      };
    }),
  ],
};
