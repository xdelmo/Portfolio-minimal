import { Signal, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';

/** The router URL, kept current across navigations (also while prerendering). Call it in an injection context. */
export function currentUrl(): Signal<string> {
  const router = inject(Router);
  return toSignal(
    router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: router.url },
  );
}

/** An href to `#fragment` on the page at `url`: under <base href="/en/"> a bare "#main" leads to the home page. */
export function inPageHref(url: string, fragment: string): string {
  return `${url.split('#')[0].slice(1)}#${fragment}`;
}
