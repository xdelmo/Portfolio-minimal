import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, afterNextRender, signal } from '@angular/core';
import { MOAI_IMAGE } from './moai-image';
import { MoaiScene } from './moai-scene';

@Component({
  selector: 'app-moai-figure',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MoaiScene, NgTemplateOutlet],
  host: { '[style.aspect-ratio]': 'ratio' },
  template: `
    <ng-template #still>
      <img class="still" [src]="image.src" [width]="image.width" [height]="image.height" alt="" loading="lazy" decoding="async" />
    </ng-template>
    @if (live() && !failed()) {
      @defer (on viewport) {
        <app-moai-scene class="scene" (failed)="failed.set(true)" />
      } @placeholder {
        <img class="still" [src]="image.src" [width]="image.width" [height]="image.height" alt="" loading="lazy" decoding="async" />
      } @error {
        <ng-container [ngTemplateOutlet]="still" />
      }
    } @else {
      <ng-container [ngTemplateOutlet]="still" />
    }
  `,
  styles: `
    @use 'styles/breakpoints' as bp;

    :host {
      display: block;
      width: min(60%, 14rem);
    }
    @include bp.up(lg) {
      :host {
        width: min(100%, 20rem);
      }
    }
    .still,
    .scene {
      display: block;
      width: 100%;
      height: 100%;
    }
  `,
})
export class MoaiFigure {
  protected readonly image = MOAI_IMAGE;
  protected readonly ratio = `${String(MOAI_IMAGE.width)} / ${String(MOAI_IMAGE.height)}`;
  protected readonly live = signal(false);
  protected readonly failed = signal(false);

  constructor() {
    afterNextRender(() => {
      this.live.set(typeof matchMedia === 'function' && !matchMedia('(prefers-reduced-motion: reduce)').matches);
    });
  }
}
