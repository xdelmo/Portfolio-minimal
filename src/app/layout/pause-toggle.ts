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
      <svg viewBox="0 0 8 8" width="20" height="20" shape-rendering="crispEdges" aria-hidden="true">
        @if (motion.paused()) {
          <path fill="currentColor" d="M2 1h1v6H2zM3 2h1v4H3zM4 3h1v2H4zM5 3.5h1v1H5z" />
        } @else {
          <path fill="currentColor" d="M1 1h2v6H1zM5 1h2v6H5z" />
        }
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
