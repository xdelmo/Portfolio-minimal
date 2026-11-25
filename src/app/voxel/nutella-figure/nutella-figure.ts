import { afterNextRender, ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import type { NutellaMood } from '../nutella.motion';
import { NutellaScene } from '../nutella-scene/nutella-scene';

/** Still render of Nutella, made by scripts/nutella-image.mjs; width and height are CSS pixels. */
export const NUTELLA_IMAGE = { src: 'images/nutella.png', darkSrc: 'images/nutella-dark.png', size: 256 } as const;

/**
 * Nutella on the 404: shows her still render immediately (and keeps it with reduced motion, reduced data or without
 * WebGL), loading Three.js only when she enters view and swapping once the first 3D frame has drawn.
 */
@Component({
  selector: 'app-nutella-figure',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NutellaScene],
  host: { '[attr.data-mood]': 'mood()' },
  templateUrl: './nutella-figure.html',
  styleUrl: './nutella-figure.scss',
})
export class NutellaFigure {
  readonly mood = input<NutellaMood>('idle');
  readonly barked = output();

  protected readonly image = NUTELLA_IMAGE;
  protected readonly live = signal(false);
  protected readonly failed = signal(false);
  protected readonly drawn = signal(false);

  constructor() {
    afterNextRender(() => {
      // keep the still render and skip the Three.js chunk with reduced motion or on a data saver
      this.live.set(typeof matchMedia === 'function' && !matchMedia('(prefers-reduced-motion: reduce), (prefers-reduced-data: reduce)').matches);
    });
  }
}
