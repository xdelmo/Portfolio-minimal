import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MotionHost } from '../motion/motion-host';

/**
 * A pixel that trails the pointer on desktop (motion/effects/cursor.ts), and the pixel arrow it turns into near a
 * section title; both hidden until that effect shows them.
 */
@Component({
  selector: 'app-pixel-cursor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: MotionHost, inputs: ['appMotion'] }],
  host: { 'aria-hidden': 'true' },
  template: `<div class="pixel-cursor"></div>
    <canvas class="pixel-arrow" width="56" height="56"></canvas>`,
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
    // near a section title: an arrow of 8px cells, redrawn on the grid for each direction (motion/arrow.ts)
    .pixel-arrow {
      position: fixed;
      top: 0;
      left: 0;
      z-index: 90;
      display: none;
      width: 56px;
      height: 56px;
      margin: -28px 0 0 -28px;
      pointer-events: none;
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
