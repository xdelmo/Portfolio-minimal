import { ChangeDetectionStrategy, Component, afterNextRender, signal } from '@angular/core';
import { MOAI_IMAGE } from './moai-image';
import { MoaiScene } from './moai-scene';

@Component({
  selector: 'app-moai-figure',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MoaiScene],
  host: { '[style.aspect-ratio]': 'ratio' },
  template: `
    <!-- the still moai stays underneath until the 3D scene has drawn its first frame -->
    <img class="still still--light" [class.covered]="drawn()" [src]="image.src" [width]="image.width" [height]="image.height" alt="" loading="lazy" decoding="async" />
    <img class="still still--dark" [class.covered]="drawn()" [src]="image.darkSrc" [width]="image.width" [height]="image.height" alt="" loading="lazy" decoding="async" />
    @if (live() && !failed()) {
      @defer (on viewport) {
        <app-moai-scene class="layer" (drawn)="drawn.set(true)" (failed)="drawn.set(false); failed.set(true)" />
      } @placeholder {
        <span class="layer"></span>
      }
    }
  `,
  styles: `
    @use 'styles/breakpoints' as bp;

    :host {
      position: relative;
      display: block;
      width: min(60%, 14rem);
    }
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
    .covered {
      visibility: hidden;
    }
    // shorter than the about text, so the sticky column has room to pin it
    @include bp.up(lg) {
      :host {
        width: auto;
        height: min(22rem, 60svh);
      }
    }
  `,
})
export class MoaiFigure {
  protected readonly image = MOAI_IMAGE;
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
