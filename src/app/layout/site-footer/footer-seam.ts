import { ChangeDetectionStrategy, Component, ElementRef, afterRenderEffect, inject, input } from '@angular/core';
import { MOTION_LOADER } from '../../motion/motion-host';
import { PixelDissolve } from '../../pixel-dissolve/pixel-dissolve';

/**
 * Lazy-loaded pixel seam above the dark footer on inner pages (issue #642), kept out of the initial bundle
 * so the home page stays within the initial JS budget.
 */
@Component({
  selector: 'app-footer-seam',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PixelDissolve],
  template: `<app-pixel-dissolve class="seam seam--footer" [cols]="120" [rows]="3" [colors]="colors" grow="up" />`,
  styles: `
    :host {
      display: contents;
    }
    .seam--footer {
      position: absolute;
      bottom: 100%;
      inset-inline: calc(50% - 50vw);
      height: var(--space-6);
    }
  `,
})
export class FooterSeam {
  readonly route = input.required<string>();
  protected readonly colors = ['--band-ink-bg', '--px-1', '--px-2', '--px-4'] as const;

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const loadMotion = inject(MOTION_LOADER);

    afterRenderEffect((onCleanup) => {
      const path = this.route();
      if (!path) return;
      if (typeof matchMedia !== 'function' || !matchMedia('(prefers-reduced-motion: no-preference)').matches) return;

      let cancelled = false;
      let kill: (() => void) | undefined;
      onCleanup(() => {
        cancelled = true;
        kill?.();
      });

      void loadMotion().then(({ gsap, ScrollTrigger }) => {
        if (cancelled) return;
        const footer = host.closest('footer');
        const seam = host.querySelector<HTMLElement>('app-pixel-dissolve.seam--footer');
        if (!footer || !seam) return;
        ScrollTrigger.refresh();
        if (seam.getBoundingClientRect().top < window.innerHeight) return;
        gsap.set(seam, { '--p': 0 });
        const tween = gsap.to(seam, {
          '--p': 1,
          ease: 'none',
          scrollTrigger: { trigger: footer, start: 'top-=48 bottom', end: 'clamp(bottom bottom)', scrub: true },
        });
        kill = () => {
          tween.scrollTrigger?.kill();
          tween.kill();
          seam.style.removeProperty('--p');
        };
      });
    });
  }
}
