import { ChangeDetectionStrategy, Component, DestroyRef, afterNextRender, computed, inject, input, signal } from '@angular/core';
import { currentUrl } from '../core/current-url';
import { CORNER_GAP, CORNER_PX } from '../motion/effects/moai';
import { MoaiFigure } from './moai-figure';
import { MOAI_DESKTOP } from './moai-cues';

/**
 * The moai on every page but the home, which has its own in the About (issue #393). On desktop it stands in the bottom-right
 * corner, fixed, at the size the home's moai shrinks to (`place="corner"`, outside the smoother); on phones and tablets its head
 * and shoulders peek above the footer, in the page's flow (`place="peek"`). Each renders only where the other does not, so a
 * page never has two scenes, also across a resize and a navigation to or from the home.
 */
@Component({
  selector: 'app-moai-guest',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MoaiFigure],
  host: { '[class.container]': "shown() && place() === 'peek'", '[attr.data-place]': 'shown() ? place() : null', '[style.--corner-px.px]': 'cornerPx', '[style.--corner-gap.px]': 'cornerGap' },
  template: `
    @if (shown()) {
      <app-moai-figure [greet]="false" [attr.data-corner]="place() === 'corner' ? '' : null" />
    }
  `,
  // the host takes its place only while it shows a moai: on the home the peek's empty box would push the footer down
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
    // the head and shoulders above the footer's top edge, the rest cut off by it
    :host([data-place='peek']) {
      display: flex;
      justify-content: flex-end;
      height: 10rem;
      margin-top: var(--space-8);
      overflow-y: clip;
    }
    // its own height (aspect-ratio), not stretched to the box: the clip cuts it, the still image keeps its proportions
    :host([data-place='peek']) app-moai-figure {
      flex: none;
      align-self: flex-start;
      width: 8rem;
      margin-right: var(--space-4);
    }
    // before hydration removes it on desktop
    @media (min-width: 1024px) and (pointer: fine) {
      :host([data-place='peek']) {
        display: none;
      }
    }
  `,
})
export class MoaiGuest {
  readonly place = input.required<'corner' | 'peek'>();
  protected readonly cornerPx = CORNER_PX;
  protected readonly cornerGap = CORNER_GAP;
  private readonly url = currentUrl();
  /** Null until hydration: the server prerenders the peek (it does not know the screen), never the corner. */
  private readonly desktop = signal<boolean | null>(null);
  protected readonly shown = computed(() => {
    if (this.url().split(/[?#]/)[0] === '/') return false;
    const desktop = this.desktop();
    return this.place() === 'corner' ? desktop === true : desktop !== true;
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
