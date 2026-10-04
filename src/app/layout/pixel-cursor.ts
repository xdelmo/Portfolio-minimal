import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MotionHost } from '../motion/motion-host';

/** A pixel that trails the pointer on desktop (motion/effects/cursor.ts); hidden until that effect shows it. */
@Component({
  selector: 'app-pixel-cursor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: MotionHost, inputs: ['appMotion'] }],
  host: { 'aria-hidden': 'true' },
  template: `<div class="pixel-cursor"></div>`,
  styles: `
    .pixel-cursor {
      position: fixed;
      top: 0;
      left: 0;
      z-index: 90;
      display: none;
      width: 8px;
      height: 8px;
      margin: -4px 0 0 -4px;
      background: var(--accent);
      pointer-events: none;
      transition:
        width 0.25s ease,
        height 0.25s ease,
        margin 0.25s ease,
        background-color 0.25s ease;
    }
    // over a link or a button the pixel opens into a frame around the pointer
    .pixel-cursor.is-over {
      width: 40px;
      height: 40px;
      margin: -20px 0 0 -20px;
      background: transparent;
      box-shadow: inset 0 0 0 2px var(--accent);
    }
  `,
})
export class PixelCursor {}
