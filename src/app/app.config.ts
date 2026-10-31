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
import { smoother } from './motion/smoother';

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
    // The router reaches an anchor with window.scrollTo: an instant jump that ignores the sticky header's scroll-margin.
    // scrollIntoView honours scroll-margin.
    provideEnvironmentInitializer(() => {
      if (!isPlatformBrowser(inject(PLATFORM_ID))) return;
      const scroller = inject(ViewportScroller);
      // a new page starts at its top at once: with smooth scroll it would glide there from where the last page was
      const toPosition = scroller.scrollToPosition.bind(scroller);
      scroller.scrollToPosition = (position, options) => {
        const smooth = smoother();
        if (smooth) smooth.scrollTop(position[1]);
        else toPosition(position, { ...options, behavior: 'instant' });
      };
      scroller.scrollToAnchor = (anchor) => {
        const target = document.getElementById(anchor);
        if (!target) return;
        const jump = (): void => {
          // smooth scroll (issue #159): the page jumps there and the content glides after it by itself; a tweened
          // scrollTo was killed by a ScrollTrigger refresh (images loading) and left the page where it was
          const smooth = smoother();
          if (smooth) smooth.scrollTo(target, false, `top ${getComputedStyle(document.documentElement).getPropertyValue('--header-h')}`);
          // native scroll: jump too (issue #245), gliding showed every picture between the two sections going by
          else target.scrollIntoView({ behavior: 'instant' });
          target.focus({ preventScroll: true });
        };
        // A ScrollTrigger refresh after the jump (pins measured again, an image loading) changes the page's height and
        // moves the section off its place: follow it while the page settles, until the visitor scrolls (issue #216).
        const go = (): void => {
          jump();
          const follow = new ResizeObserver(jump);
          const stop = (): void => { follow.disconnect(); };
          follow.observe(document.body);
          setTimeout(stop, 2000);
          for (const type of ['wheel', 'touchstart', 'keydown']) addEventListener(type, stop, { once: true, passive: true });
        };
        // Coming from another page, the anchor's motion effects are still starting: their first measure (ScrollTrigger
        // scrolls to the top and back) would stop the smooth scroll a few pixels in. Scroll once they are running.
        const host = target.closest('[data-motion="pending"]');
        if (!host) {
          go();
          return;
        }
        const started = new MutationObserver(() => {
          if (host.getAttribute('data-motion') === 'pending') return;
          started.disconnect();
          requestAnimationFrame(go);
        });
        started.observe(host, { attributes: true, attributeFilter: ['data-motion'] });
      };
      // A page opened at an anchor (/en/#work) is scrolled by the browser alone, often while the hero is still set in the
      // wider fallback font: once the condensed headline is in, the hero is shorter and the page sits past its section.
      // Then the motion effects start and refresh their pins: follow the section as a header link does (issue #270, the
      // one-off scroll left #work 3px off in WebKit).
      const opened = decodeURIComponent(location.hash.slice(1));
      if (document.getElementById(opened)) void document.fonts.ready.then(() => { scroller.scrollToAnchor(opened); });
    }),
  ],
};
