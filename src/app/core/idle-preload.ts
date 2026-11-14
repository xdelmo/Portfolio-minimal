import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import type { PreloadingStrategy, Route } from '@angular/router';
import { Observable, from, of, switchMap } from 'rxjs';

/** Resolves once the page has loaded and the browser is idle (no timeout: a forced run would add to Lighthouse's TBT). */
export function whenIdle(): Promise<void> {
  const loaded =
    document.readyState === 'complete'
      ? Promise.resolve()
      : new Promise<void>((resolve) => { addEventListener('load', () => { resolve(); }, { once: true }); });
  return loaded.then(
    () =>
      new Promise<void>((resolve) => {
        if ('requestIdleCallback' in window) requestIdleCallback(() => { resolve(); });
        else setTimeout(resolve, 2000);
      }),
  );
}

/**
 * Fetches every lazy page once the browser is idle, so a click opens the next page without waiting for its chunk
 * (issue #322). Not with Save-Data: the visitor asked for fewer bytes.
 */
@Injectable({ providedIn: 'root' })
export class IdlePreload implements PreloadingStrategy {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));

  preload(_route: Route, load: () => Observable<unknown>): Observable<unknown> {
    if (!this.browser || (navigator as { connection?: { saveData?: boolean } }).connection?.saveData) return of(null);
    return from(whenIdle()).pipe(switchMap(load));
  }
}
