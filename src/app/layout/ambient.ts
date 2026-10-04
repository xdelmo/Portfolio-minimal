import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MotionHost } from '../motion/motion-host';

/**
 * Pastel orbs drifting behind the whole site (motion/effects/ambient.ts moves them). Soft radial gradients, no
 * blur filter, under the content and the coloured bands; hidden with reduced motion.
 */
@Component({
  selector: 'app-ambient',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: MotionHost, inputs: ['appMotion'] }],
  host: { 'aria-hidden': 'true' },
  template: `
    <div class="ambient" data-tone="top">
      @for (orb of orbs; track orb) {
        <span [class]="'orb orb--' + orb"></span>
      }
    </div>
  `,
  styles: `
    @use 'styles/breakpoints' as bp;

    .ambient {
      position: fixed;
      inset: 0;
      z-index: -1;
      overflow: hidden;
      pointer-events: none;
    }
    .orb {
      position: absolute;
      width: 46vmax;
      aspect-ratio: 1;
      border-radius: 50%;
      background: radial-gradient(circle closest-side, var(--c) 0%, transparent 100%);
      opacity: calc(var(--ambient-alpha) * var(--w, 1));
      translate: -50% -50%;
      transition: opacity 1.2s ease;
    }
    .orb--1 { --c: var(--px-2); left: 82%; top: 18%; }
    .orb--2 { --c: var(--px-3); left: 12%; top: 70%; }
    .orb--3 { --c: var(--px-4); left: 60%; top: 85%; }
    .orb--4 { --c: var(--px-5); left: 30%; top: 22%; }
    .orb--5 { --c: var(--px-6); left: 92%; top: 62%; }
    // the section in view leans the mix towards its own tone by dimming the other orbs; no orb ever goes above
    // --ambient-alpha, which keeps every text colour at 4.5:1 over it (scripts/ambient-contrast.test.mjs)
    [data-tone='about'] { .orb--3, .orb--4, .orb--5 { --w: 0.4; } }
    [data-tone='experience'] { .orb--1, .orb--4, .orb--5 { --w: 0.4; } }
    [data-tone='stack'] { .orb--1, .orb--2, .orb--5 { --w: 0.4; } }
    [data-tone='contact'] { .orb--1, .orb--2, .orb--3, .orb--4 { --w: 0.4; } }
    // phones: three orbs
    .orb--4,
    .orb--5 {
      display: none;
    }
    @include bp.up(md) {
      .orb--4,
      .orb--5 {
        display: block;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .ambient {
        display: none;
      }
    }
  `,
})
export class Ambient {
  protected readonly orbs = [1, 2, 3, 4, 5];
}
