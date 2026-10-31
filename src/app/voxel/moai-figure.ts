import { ChangeDetectionStrategy, Component, afterNextRender, signal } from '@angular/core';
import { MOAI_BLEED } from './moai.model';
import { MoaiScene } from './moai-scene';

/** Still render of the moai, made by scripts/moai-image.mjs; width and height are CSS pixels. */
export const MOAI_IMAGE = { src: 'images/moai.png', darkSrc: 'images/moai-dark.png', width: 288, height: 655 } as const;

@Component({
  selector: 'app-moai-figure',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MoaiScene],
  host: { '[style.aspect-ratio]': 'ratio', '[style.--moai-bleed]': 'bleed' },
  template: `
    <!-- the still moai stays underneath until the 3D scene has drawn its first frame -->
    <span class="body">
      <img class="still still--light" [class.covered]="drawn()" [src]="image.src" [width]="image.width" [height]="image.height" alt="" loading="lazy" decoding="async" />
      <img class="still still--dark" [class.covered]="drawn()" [src]="image.darkSrc" [width]="image.width" [height]="image.height" alt="" loading="lazy" decoding="async" />
      @if (live() && !failed()) {
        @defer (on viewport) {
          <app-moai-scene class="layer" (drawn)="drawn.set(true)" (failed)="drawn.set(false); failed.set(true)" />
        } @placeholder {
          <span class="layer"></span>
        }
      }
    </span>
  `,
  styles: `
    @use 'styles/breakpoints' as bp;

    :host {
      position: relative;
      display: block;
      width: min(60%, 14rem);
    }
    // desktop: pinned beside the About and moved into the corner as the About scrolls away (motion/effects/moai.ts),
    // where it lets the clicks beside it through; on the inner box, never the pinned host, whose box the pin measures
    @include bp.up(lg) {
      :host {
        width: auto;
        // shorter than the about text, so the pin has room beside it, and never taller than the screen below the header
        height: min(26rem, calc(100svh - var(--header-h) - 2 * var(--space-8)));
      }
      // its box stays where the pin holds it, so it lets clicks through; only the small moai takes them, its scene (a
      // double click still blows the bubble) or, without WebGL, the still image
      :host([data-corner]) {
        pointer-events: none;
      }
      :host([data-corner]) .body {
        pointer-events: auto;
      }
      .body {
        translate: var(--moai-x, 0) var(--moai-y, 0);
        scale: var(--moai-s, 1);
        transform-origin: 100% 100%;
      }
    }
    .body,
    .still,
    .layer {
      position: absolute;
      inset: 0;
      display: block;
      width: 100%;
      height: 100%;
    }
    .still--dark {
      display: none;
    }
    :host-context([data-theme='dark']) .still--light {
      display: none;
    }
    :host-context([data-theme='dark']) .still--dark {
      display: block;
    }
    // wider than the figure on both sides, the moai drawn at the same size: the bubble is not cut when it turns
    app-moai-scene.layer {
      left: calc(-100% * var(--moai-bleed));
      width: calc(100% * (1 + 2 * var(--moai-bleed)));
    }
    .covered {
      visibility: hidden;
    }
  `,
})
export class MoaiFigure {
  protected readonly image = MOAI_IMAGE;
  protected readonly bleed = MOAI_BLEED;
  protected readonly ratio = `${String(MOAI_IMAGE.width)} / ${String(MOAI_IMAGE.height)}`;
  protected readonly live = signal(false);
  protected readonly failed = signal(false);
  protected readonly drawn = signal(false);

  constructor() {
    afterNextRender(() => {
      this.live.set(typeof matchMedia === 'function' && !matchMedia('(prefers-reduced-motion: reduce)').matches);
    });
  }
}
