import { IMAGE_LOADER } from '@angular/common';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
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
  ],
};
