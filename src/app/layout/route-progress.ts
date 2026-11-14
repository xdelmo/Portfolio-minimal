import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationSkipped, NavigationStart, Router } from '@angular/router';

/**
 * A thin bar on the header's bottom edge while the router opens another page (issue #322): only a slow page change
 * shows it, since the bar waits 200ms in CSS before it appears. Not on the first navigation: the page is already there.
 */
@Component({
  selector: 'app-route-progress',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@if (busy()) {
    <div class="bar" role="progressbar" i18n-aria-label="@@a11y.loadingPage" aria-label="Loading the page"></div>
  }`,
  styles: `
    :host {
      position: absolute;
      inset: auto 0 -2px;
      height: 4px;
      pointer-events: none;
    }
    .bar {
      height: 100%;
      background: var(--accent-line);
      transform-origin: left;
      /* creeps towards the end in steps and never reaches it: the page arriving ends it */
      animation: route-progress 8s steps(16) 200ms both;
    }
    @keyframes route-progress {
      from {
        transform: scaleX(0);
      }
      to {
        transform: scaleX(0.9);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .bar {
        animation: route-wait 0s 200ms both;
      }
      @keyframes route-wait {
        from {
          opacity: 0;
        }
      }
    }
    @media (forced-colors: active) {
      .bar {
        forced-color-adjust: none;
        background: Highlight;
      }
    }
  `,
})
export class RouteProgress {
  protected readonly busy = signal(false);

  constructor() {
    inject(Router)
      .events.pipe(takeUntilDestroyed())
      .subscribe((event) => {
        if (event instanceof NavigationStart) this.busy.set(event.id > 1);
        else if (
          event instanceof NavigationEnd ||
          event instanceof NavigationCancel ||
          event instanceof NavigationError ||
          event instanceof NavigationSkipped
        ) {
          this.busy.set(false);
        }
      });
  }
}
