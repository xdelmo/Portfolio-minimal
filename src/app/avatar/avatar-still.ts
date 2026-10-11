import { ChangeDetectionStrategy, Component, afterNextRender } from '@angular/core';
import { AVATAR_IMAGE } from './avatar-image';

/**
 * The still avatar in the hero: what shows without JavaScript, with reduced motion and without WebGL, and the slot
 * the 3D avatar starts from (motion/effects/walker.ts).
 */
@Component({
  selector: 'app-avatar-still',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[style.aspect-ratio]': 'ratio' },
  template: `
    <img class="still still--light" [src]="image.src" [width]="image.width" [height]="image.height" alt="" fetchpriority="low" loading="lazy" decoding="async" />
    <img class="still still--dark" [src]="image.darkSrc" [width]="image.width" [height]="image.height" alt="" fetchpriority="low" loading="lazy" decoding="async" />
  `,
  styles: `
    @use 'styles/breakpoints' as bp;

    // phones: above the hero's title, where the field is lit
    :host {
      position: relative;
      display: block;
      height: var(--space-16);
    }
    // the 3D avatar stands on it (walker.ts)
    :host(.is-covered) {
      visibility: hidden;
    }
    // desktop: in the hero's second column, beside the text, standing on the field
    @include bp.up(lg) {
      :host {
        grid-column: 2;
        grid-row: 1 / span 4;
        align-self: center;
        justify-self: center;
        height: min(28rem, calc(100svh - var(--header-h) - 2 * var(--space-8)));
      }
    }
    .still {
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
    // until the page has painted: a lazy image that is not displayed is not fetched (src/index.html sets the class)
    :host-context(.avatar-wait) .still {
      display: none;
    }
  `,
})
export class AvatarStill {
  protected readonly image = AVATAR_IMAGE;
  protected readonly ratio = `${String(AVATAR_IMAGE.width)} / ${String(AVATAR_IMAGE.height)}`;

  constructor() {
    // Angular starts after the first frame (scripts/after-paint.mjs), so this is after the headline's paint
    afterNextRender(() => {
      document.documentElement.classList.remove('avatar-wait');
    });
  }
}
