import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageSwitch } from '../core/i18n/language-switch';
import { ThemeToggle } from '../core/theme/theme-toggle';

@Component({
  selector: 'app-site-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LanguageSwitch, ThemeToggle],
  template: `
    <a class="skip-link" href="#main" (click)="skipToMain($event)" i18n="@@a11y.skip">Skip to content</a>
    <header class="site-header container">
      <a class="logo" routerLink="/" i18n-aria-label="@@nav.home" aria-label="Emanuele Del Monte, home">edm.</a>
      <nav i18n-aria-label="@@nav.label" aria-label="Main">
        <a routerLink="/" fragment="work" i18n="@@nav.work">Work</a>
        <a routerLink="/" fragment="about" i18n="@@nav.about">About</a>
        <a routerLink="/" fragment="contact" i18n="@@nav.contact">Contact</a>
      </nav>
      <div class="controls">
        <app-language-switch />
        <app-theme-toggle />
      </div>
    </header>
  `,
  styles: `
    @use 'styles/breakpoints' as bp;

    .site-header {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      min-height: var(--space-12);
    }
    .logo {
      margin-right: auto;
      color: var(--fg);
      font-size: var(--step-1);
      font-weight: 700;
      text-decoration: none;
    }
    nav {
      display: none;
      gap: var(--space-3);
    }
    nav a {
      color: var(--fg);
      text-decoration: none;
    }
    nav a:hover {
      text-decoration: underline;
    }
    .controls {
      display: flex;
      align-items: center;
    }
    @include bp.up(md) {
      nav {
        display: flex;
      }
    }
  `,
})
export class SiteHeader {
  // <base href="/en/"> would resolve "#main" to the home page, so move focus in place instead.
  skipToMain(event: Event): void {
    event.preventDefault();
    document.getElementById('main')?.focus();
  }
}
