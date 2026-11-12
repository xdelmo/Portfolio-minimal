import { ChangeDetectionStrategy, Component, afterNextRender, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { currentUrl, inPageHref } from '../core/current-url';
import { CONTENT } from '../content/content';
import { APP_VERSION } from '../core/version.generated';

/**
 * The end of every page: the year, a way back up, my profiles, the privacy page, and the door to the easter egg (craft.wild.as closes
 * with a game too). The email is a link named "Email", so the home page does not print the address twice.
 */
@Component({
  selector: 'app-site-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './site-footer.html',
  styleUrl: './site-footer.scss',
})
export class SiteFooter {
  protected readonly content = inject(CONTENT);
  protected readonly year = new Date().getFullYear();
  protected readonly version = APP_VERSION;
  protected readonly ready = signal(false);

  constructor() {
    afterNextRender(() => {
      this.ready.set(true);
    });
  }

  private readonly url = currentUrl();
  protected readonly toMain = computed(() => inPageHref(this.url(), 'main'));

  // with JavaScript, scroll in place and move the focus to the content
  protected toTop(event: Event): void {
    event.preventDefault();
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'instant' : 'smooth' });
    document.getElementById('main')?.focus({ preventScroll: true });
  }
}
