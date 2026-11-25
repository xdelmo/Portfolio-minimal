import { ChangeDetectionStrategy, Component, ElementRef, afterNextRender, afterRenderEffect, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { currentUrl, inPageHref } from '../../core/current-url';
import { CONTENT } from '../../content/content';
import { APP_VERSION } from '../../core/version.generated';
import { MOTION_LOADER } from '../../motion/motion-host';
import { scrollToTop } from '../../motion/smoother';
import { PixelDissolve } from '../../pixel-dissolve/pixel-dissolve';

/**
 * The end of every page: the year, a way back up, my profiles, the privacy page, and the door to the easter egg (craft.wild.as closes
 * with a game too). The email is a link named "Email", so the home page does not print the address twice.
 */
@Component({
  selector: 'app-site-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PixelDissolve],
  templateUrl: './site-footer.html',
  styleUrl: './site-footer.scss',
})
export class SiteFooter {
  protected readonly content = inject(CONTENT);
  // the prerendered page carries the build year; the visitor's clock corrects it after New Year (issue #583)
  protected readonly year = signal(new Date().getFullYear());
  protected readonly version = APP_VERSION;
  protected readonly ready = signal(false);
  protected readonly footerSeam = ['--band-ink-bg', '--px-1', '--px-2', '--px-4'] as const;

  private readonly url = currentUrl();
  protected readonly innerPage = computed(() => {
    const path = this.url().split(/[?#]/)[0];
    return path !== '' && path !== '/';
  });
  protected readonly toMain = computed(() => inPageHref(this.url(), 'main'));

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const loadMotion = inject(MOTION_LOADER);

    afterNextRender(() => {
      this.ready.set(true);
      this.year.set(new Date().getFullYear());
    });

    afterRenderEffect((onCleanup) => {
      const inner = this.innerPage();
      const ready = this.ready();
      const path = this.url().split(/[?#]/)[0];
      if (!inner || !ready || !path) return;
      if (typeof matchMedia !== 'function' || !matchMedia('(prefers-reduced-motion: no-preference)').matches) return;

      let cancelled = false;
      let kill: (() => void) | undefined;
      onCleanup(() => {
        cancelled = true;
        kill?.();
      });

      void loadMotion().then(({ gsap, ScrollTrigger }) => {
        if (cancelled) return;
        const footer = host.querySelector<HTMLElement>('footer');
        const seam = footer?.querySelector<HTMLElement>('.seam--footer');
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

  // with JavaScript, scroll in place and move the focus to the content
  protected toTop(event: Event): void {
    event.preventDefault();
    scrollToTop();
  }
}
