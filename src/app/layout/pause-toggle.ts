import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MotionPause } from '../motion/pause';

/** Pauses all automatic motion (WCAG 2.2.2). Hidden by CSS with reduced motion, where nothing moves by itself. */
@Component({
  selector: 'app-pause-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="pause-toggle"
      (click)="motion.toggle()"
      [attr.aria-pressed]="motion.paused()"
      i18n-aria-label="@@motion.pause"
      aria-label="Pause animations"
    >
      <!-- both icons ship in the prerendered page; CSS picks one from data-motion-paused, set before first paint (issue #678) -->
      <svg class="play" viewBox="0 0 8 8" width="16" height="16" shape-rendering="crispEdges" aria-hidden="true">
        <path fill="currentColor" d="M2 1h1v6H2zM3 2h1v4H3zM4 3h1v2H4zM5 3.5h1v1H5z" />
      </svg>
      <svg class="pause" viewBox="0 0 8 8" width="16" height="16" shape-rendering="crispEdges" aria-hidden="true">
        <path fill="currentColor" d="M1 1h2v6H1zM5 1h2v6H5z" />
      </svg>
    </button>
  `,
  styles: `
    .pause-toggle {
      display: grid;
      place-items: center;
      width: 48px;
      height: 48px;
      padding: 0;
      border: 0;
      background: transparent;
      color: var(--fg);
      cursor: pointer;
    }
    .play,
    :host-context([data-motion-paused]) .pause {
      display: none;
    }
    :host-context([data-motion-paused]) .play {
      display: block;
    }
    @media (hover: hover) {
      .pause-toggle:hover {
        color: var(--link);
      }
    }
    @media (hover: hover) and (prefers-reduced-motion: no-preference) {
      .pause-toggle {
        transition: color 120ms steps(2);
      }
    }
    .pause-toggle:active svg {
      translate: 0 2px;
    }
    @media (prefers-reduced-motion: reduce) {
      :host {
        display: none;
      }
    }
  `,
})
export class PauseToggle {
  protected readonly motion = inject(MotionPause);
}
