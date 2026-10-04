import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MotionHost } from '../motion/motion-host';

/** Thin bar along the top edge showing reading progress; empty without motion (scaleX 0). */
@Component({
  selector: 'app-scroll-progress',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: MotionHost, inputs: ['appMotion'] }],
  template: `<div class="scroll-progress" aria-hidden="true"></div>`,
  styles: `
    .scroll-progress {
      position: fixed;
      inset: 0 0 auto;
      z-index: 50;
      height: 3px;
      background: var(--accent);
      transform: scaleX(0);
      transform-origin: 0 50%;
      pointer-events: none;
    }
  `,
})
export class ScrollProgress {}
