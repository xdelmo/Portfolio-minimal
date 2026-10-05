import { IMAGE_LOADER, ViewportScroller, isPlatformBrowser } from '@angular/common';
import { ApplicationConfig, PLATFORM_ID, inject, provideBrowserGlobalErrorListeners, provideEnvironmentInitializer } from '@angular/core';
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
      if (!isPlatformBrowser(inject(PLATFORM_ID))) return;
      inject(ViewportScroller).scrollToAnchor = (anchor) => {
        const target = document.getElementById(anchor);
        if (!target) return;
        target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
        target.focus({ preventScroll: true });
      };
      // A page opened at an anchor (/en/#work) is scrolled by the browser alone, often while the hero is still set in the
      // wider fallback font: once the condensed headline is in, the hero is shorter and the page sits past its section.
      const opened = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (opened) void document.fonts.ready.then(() => { opened.scrollIntoView({ behavior: 'instant' }); });
    }),
  ],
};
