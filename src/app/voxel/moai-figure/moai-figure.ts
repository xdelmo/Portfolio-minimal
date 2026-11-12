import { ChangeDetectionStrategy, Component, afterNextRender, input, signal } from '@angular/core';
import { MOAI_BLEED } from '../moai.model';
import { MoaiScene } from '../moai-scene/moai-scene';

/** Still render of the moai, made by scripts/moai-image.mjs; width and height are CSS pixels. */
export const MOAI_IMAGE = { src: 'images/moai.png', darkSrc: 'images/moai-dark.png', width: 288, height: 655 } as const;

@Component({
  selector: 'app-moai-figure',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MoaiScene],
  host: { '[style.aspect-ratio]': 'ratio', '[style.--moai-bleed]': 'bleed' },
  templateUrl: './moai-figure.html',
  styleUrl: './moai-figure.scss',
})
export class MoaiFigure {
  /** Whether it waves once the intro is over: only on the home (issue #393). */
  readonly greet = input(true);
  protected readonly image = MOAI_IMAGE;
  protected readonly bleed = MOAI_BLEED;
  protected readonly ratio = `${String(MOAI_IMAGE.width)} / ${String(MOAI_IMAGE.height)}`;
  protected readonly live = signal(false);
  protected readonly failed = signal(false);
  protected readonly drawn = signal(false);

  constructor() {
    afterNextRender(() => {
      // the still image only, and no Three.js chunk, with reduced motion or on a data saver (issue #431)
      this.live.set(typeof matchMedia === 'function' && !matchMedia('(prefers-reduced-motion: reduce), (prefers-reduced-data: reduce)').matches);
    });
  }
}
