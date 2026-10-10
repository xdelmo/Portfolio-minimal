import { ChangeDetectionStrategy, Component, DestroyRef, afterNextRender, inject, signal } from '@angular/core';

/** It shows once the page has scrolled this many screens down. */
export const SHOW_AFTER_SCREENS = 1.5;

/**
 * A way back up on long pages, on phones (issue #129: the mobile best practices the user asked to follow). The footer
 * has one at the very end; this one waits in the corner once the page has scrolled a screen and a half. Rendered
 * only once the app runs: without JavaScript the footer's link still works.
 */
@Component({
  selector: 'app-back-to-top',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (shown()) {
      <button type="button" class="back-to-top" i18n-aria-label="@@footer.top" aria-label="Back to top" (click)="toTop()">
        <svg viewBox="0 0 8 8" width="16" height="16" shape-rendering="crispEdges" fill="currentColor" aria-hidden="true" focusable="false">
          <path d="M3 0h2v1h-2zM2 1h4v1h-4zM1 2h6v1h-6zM0 3h2v1h-2zM3 3h2v5h-2zM6 3h2v1h-2z" />
        </svg>
      </button>
    }
  `,
  styles: `
    @use 'styles/breakpoints' as bp;

    // the ink band's colours, a hard square like the rest of the site; phones only (the header's links are there on
    // wider screens)
    .back-to-top {
      position: fixed;
      right: var(--space-2);
      bottom: var(--space-2);
      z-index: 30;
      display: grid;
      place-items: center;
      width: 48px;
      height: 48px;
      border: 2px solid var(--band-ink-fg);
      background: var(--band-ink-bg);
      color: var(--band-ink-fg);
      cursor: pointer;
      @include bp.up(md) {
        display: none;
      }
    }
    @media (prefers-reduced-motion: no-preference) {
      .back-to-top {
        animation: back-in 160ms steps(4);
      }
    }
    @keyframes back-in {
      from {
        clip-path: inset(100% 0 0 0);
      }
    }
  `,
})
export class BackToTop {
  protected readonly shown = signal(false);

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const update = (): void => {
        this.shown.set(window.scrollY > window.innerHeight * SHOW_AFTER_SCREENS);
      };
      update();
      window.addEventListener('scroll', update, { passive: true });
      destroyRef.onDestroy(() => {
        window.removeEventListener('scroll', update);
      });
    });
  }

  /** Like the footer's link: up at once with reduced motion, and the focus to the start of the content. */
  protected toTop(): void {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'instant' : 'smooth' });
    document.getElementById('main')?.focus({ preventScroll: true });
  }
}
