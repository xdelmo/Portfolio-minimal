import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { dissolvePaths } from './dissolve';

/**
 * A strip of pixels that forms in steps as one CSS variable `--p` goes from 0 to 1.
 * Without JavaScript or motion `--p` is unset and counts as 1: the seams are formed.
 */
@Component({
  selector: 'app-pixel-dissolve',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg aria-hidden="true" focusable="false" [attr.viewBox]="viewBox()" preserveAspectRatio="xMidYMax slice" shape-rendering="crispEdges">
      @for (layer of layers(); track $index) {
        <path [attr.d]="layer.d" [style.--t]="layer.t" [style.fill]="'var(' + colors()[layer.color] + ')'" />
      }
    </svg>
  `,
  styles: `
    :host {
      display: block;
      pointer-events: none;
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
export class PixelDissolve {
  readonly cols = input.required<number>();
  readonly rows = input.required<number>();
  /** CSS custom property names; the first one fills most cells. */
  readonly colors = input.required<readonly string[]>();
  readonly grow = input<'up' | 'none'>('none');

  protected readonly viewBox = computed(() => `0 0 ${String(this.cols())} ${String(this.rows())}`);
  protected readonly layers = computed(() => dissolvePaths(this.cols(), this.rows(), this.grow(), this.colors().length, 8));
}
