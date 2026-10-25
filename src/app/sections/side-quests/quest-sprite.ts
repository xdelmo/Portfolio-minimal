import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SPRITES, spritePaths, type SpriteName } from './sprites';

/**
 * A side quest's item, 16 × 16 pixels. It builds itself from the bottom as `--p` goes from 0 to 1 (scrubbed by
 * effects/dissolve.ts through `data-scrub`); without JavaScript or motion `--p` is unset and the item is whole.
 */
@Component({
  selector: 'app-quest-sprite',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-sprite]': 'name()', 'data-scrub': '' },
  template: `
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" shape-rendering="crispEdges">
      @for (layer of layers(); track $index) {
        <path [attr.d]="layer.d" [style.--t]="layer.t" [style.fill]="'var(' + layer.color + ')'" />
      }
    </svg>
  `,
  styles: `
    :host {
      display: block;
    }
    svg {
      display: block;
      width: 100%;
      height: 100%;
    }
    path {
      opacity: clamp(0, calc((var(--p, 1) - var(--t)) * 1000), 1);
    }
  `,
})
export class QuestSprite {
  readonly name = input.required<SpriteName>();
  protected readonly layers = computed(() => spritePaths(SPRITES[this.name()], 4));
}
