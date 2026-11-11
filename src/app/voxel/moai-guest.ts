import { ChangeDetectionStrategy, Component, DestroyRef, afterNextRender, computed, inject, signal } from '@angular/core';
import { currentUrl } from '../core/current-url';
import { CORNER_GAP, CORNER_PX } from '../motion/effects/moai';
import { MoaiFigure } from './moai-figure';
import { MOAI_DESKTOP } from './moai-cues';

/**
 * The moai on every page but the home, which has its own in the About (issue #393, #416). On desktop it stands in the bottom-right
 * corner, fixed, at the size the home's moai shrinks to (outside the smoother). On phones and tablets it is not rendered.
 */
@Component({
  selector: 'app-moai-guest',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MoaiFigure],
  host: {
    '[attr.data-place]': "shown() ? 'corner' : null",
    '[style.--corner-px.px]': 'cornerPx',
    '[style.--corner-gap.px]': 'cornerGap',
  },
  template: `
    @if (shown()) {
      <app-moai-figure [greet]="false" data-corner />
    }
  `,
  styles: `
    :host([data-place='corner']) {
      position: fixed;
      right: var(--corner-gap);
      bottom: var(--corner-gap);
      z-index: 20;
      height: var(--corner-px);
      pointer-events: none;
    }
    :host([data-place='corner']) app-moai-figure {
      width: auto;
      height: 100%;
    }
  `,
})
export class MoaiGuest {
  protected readonly cornerPx = CORNER_PX;
  protected readonly cornerGap = CORNER_GAP;
  private readonly url = currentUrl();
  /** Null until hydration: the server does not know the screen size. */
  private readonly desktop = signal<boolean | null>(null);
  protected readonly shown = computed(() => {
    if (this.url().split(/[?#]/)[0] === '/') return false;
    return this.desktop() === true;
  });

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const query = matchMedia(MOAI_DESKTOP);
      const update = () => {
        this.desktop.set(query.matches);
      };
      update();
      query.addEventListener('change', update);
      destroyRef.onDestroy(() => {
        query.removeEventListener('change', update);
      });
    });
  }
}
