import { ChangeDetectionStrategy, Component, DestroyRef, afterNextRender, inject, signal } from '@angular/core';
import { scrollToTop } from '../../motion/smoother';

/** It shows once the page has scrolled this many screens down. */
export const SHOW_AFTER_SCREENS = 1.5;

/**
 * A way back up on long pages, on phones (issue #129: the mobile best practices the user asked to follow). The footer
 * has one at the very end; this one waits in the corner once the page has scrolled a screen and a half, and steps aside
 * while the footer shows. Rendered
 * only once the app runs: without JavaScript the footer's link still works.
 */
@Component({
  selector: 'app-back-to-top',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './back-to-top.html',
  styleUrl: './back-to-top.scss',
})
export class BackToTop {
  protected readonly shown = signal(false);

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      // hidden while the footer is on screen: its own link is there, and the button would cover its links (issue #326).
      // Measured on every scroll, not taken from the observer: that reports a frame or more late, so a jump to the footer
      // showed the button over "Press start" for a moment and a tap there hit it instead (issue #579)
      const footer = document.querySelector('app-site-footer');
      const update = (): void => {
        const footerSeen = (footer?.getBoundingClientRect().top ?? Infinity) < window.innerHeight;
        this.shown.set(!footerSeen && window.scrollY > window.innerHeight * SHOW_AFTER_SCREENS);
      };
      const observer = new IntersectionObserver(update);
      if (footer) observer.observe(footer);
      update();
      window.addEventListener('scroll', update, { passive: true });
      destroyRef.onDestroy(() => {
        window.removeEventListener('scroll', update);
        observer.disconnect();
      });
    });
  }

  /** Like the footer's link: up at once with reduced motion, and the focus to the start of the content. */
  protected toTop(): void {
    scrollToTop();
  }
}
