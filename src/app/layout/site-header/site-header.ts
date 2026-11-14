import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CONTENT } from '../../content/content';
import { currentUrl, inPageHref } from '../../core/current-url';
import { LanguageSwitch } from '../../core/i18n/language-switch/language-switch';
import { ThemeToggle } from '../../core/theme/theme-toggle';
import { MoaiMark } from '../moai-mark';
import { MusicToggle } from '../music-toggle';
import { PauseToggle } from '../pause-toggle';
import { RouteProgress } from '../route-progress';
import { SiteMenu } from '../site-menu/site-menu';

@Component({
  selector: 'app-site-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, LanguageSwitch, ThemeToggle, PauseToggle, MusicToggle, SiteMenu, MoaiMark, RouteProgress],
  templateUrl: './site-header.html',
  styleUrl: './site-header.scss',
})
export class SiteHeader {
  protected readonly content = inject(CONTENT);
  private readonly url = currentUrl();
  protected readonly toMain = computed(() => inPageHref(this.url(), 'main'));

  // with JavaScript, move the focus in place

  skipToMain(event: Event): void {
    event.preventDefault();
    document.getElementById('main')?.focus();
  }
}
