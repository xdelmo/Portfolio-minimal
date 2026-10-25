import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { hash } from '../pixel-field/field';

/**
 * When each cell of a pixel dissolve appears, as a fraction of the scroll through it: one value in [0, 1) per cell,
 * row by row. Random but stable, so the prerendered markup matches the browser; with `up` the lower rows come first.
 */
export function dissolveThresholds(cols: number, rows: number, grow: 'up' | 'none'): Float32Array {
  const out = new Float32Array(cols * rows);
  for (let row = 0; row < rows; row++) {
    const lift = grow === 'up' && rows > 1 ? 1 - row / (rows - 1) : 0.5;
    for (let col = 0; col < cols; col++) {
      const i = row * cols + col;
      out[i] = Math.min(0.999, 0.6 * hash(i + 53) + 0.4 * lift);
    }
  }
  return out;
}

export interface DissolvePath {
  /** When this layer appears, in [0, 1). */
  t: number;
  /** Index into the colours the caller passed. */
  color: number;
  /** Unit squares in a viewBox of cols × rows. */
  d: string;
}

/**
 * The cells grouped into `steps` layers per colour, one path each: a few paths instead of hundreds of rects keeps
 * the prerendered page light, and the reveal moves in steps, like the rest of the site. With `up` the top rows
 * keep only some of their cells, so the band crumbles towards the section above.
 */
export function dissolvePaths(cols: number, rows: number, grow: 'up' | 'none', colors: number, steps: number): DissolvePath[] {
  const thresholds = dissolveThresholds(cols, rows, grow);
  const layers = new Map<string, DissolvePath>();
  for (let row = 0; row < rows; row++) {
    const density = grow === 'up' && rows > 1 ? 0.3 + 0.7 * (row / (rows - 1)) : 1;
    for (let col = 0; col < cols; col++) {
      const i = row * cols + col;
      if (hash(i + 71) >= density) continue;
      const step = Math.floor(thresholds[i] * steps);
      // the first colour is the band itself and fills most cells; the others are the pixel tints
      const color = colors > 1 && hash(i + 89) > 0.7 ? 1 + Math.floor(hash(i + 97) * (colors - 1)) : 0;
      const key = `${String(step)}:${String(color)}`;
      const layer = layers.get(key) ?? { t: step / steps, color, d: '' };
      layer.d += `M${String(col)} ${String(row)}h1v1h-1z`;
      layers.set(key, layer);
    }
  }
  return [...layers.values()];
}

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
