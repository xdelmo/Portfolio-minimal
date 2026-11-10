import { LocationStrategy } from '@angular/common';
import { inject } from '@angular/core';
import { NavigationError, Router, withNavigationErrorHandler } from '@angular/router';

/** Chromium, Firefox and WebKit's messages for a lazy chunk that could not be fetched (a new deploy, a lost network). */
export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /dynamically imported module|Importing a module script failed/i.test(message);
}

/**
 * A page change whose chunk is gone loads that page from the server instead (issue #429): it is prerendered, so it
 * shows even without the app. Never on the first navigation, which would reload the page it is already on, forever.
 */
export const withChunkReload = (): ReturnType<typeof withNavigationErrorHandler> =>
  withNavigationErrorHandler((event: NavigationError) => {
    const router = inject(Router);
    if (!router.navigated || !isChunkLoadError(event.error)) return;
    location.assign(inject(LocationStrategy).prepareExternalUrl(event.url));
  });
