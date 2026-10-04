import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageSwitch } from '../core/i18n/language-switch';
import { ThemeToggle } from '../core/theme/theme-toggle';
import { PauseToggle } from './pause-toggle';

@Component({
  selector: 'app-site-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LanguageSwitch, ThemeToggle, PauseToggle],
  template: `
    <a class="skip-link" href="#main" (click)="skipToMain($event)" i18n="@@a11y.skip">Skip to content</a>
    <header class="site-header container">
      <a class="logo" routerLink="/" i18n-aria-label="@@nav.home" aria-label="Emanuele Del Monte, home">edm.</a>
      <nav i18n-aria-label="@@nav.label" aria-label="Main">
        <a routerLink="/" fragment="work" i18n="@@nav.work">Work</a>
        <a routerLink="/" fragment="about" i18n="@@nav.about">About</a>
        <a routerLink="/" fragment="experience" i18n="@@nav.experience">Experience</a>
        <a routerLink="/" fragment="contact" i18n="@@nav.contact">Contact</a>
      </nav>
      <div class="controls">
        <app-language-switch />
        <app-pause-toggle />
        <app-theme-toggle />
      </div>
    </header>
  `,
  styles: `
    @use 'styles/breakpoints' as bp;

    /* always on screen: sticky over the page, under the progress bar (z 50) and the intro (z 100) */
    :host {
      position: sticky;
      top: 0;
      z-index: 40;
      display: block;
      background: var(--bg);
      box-shadow: 0 1px 0 var(--rule);
    }
    .site-header {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      min-height: var(--header-h);
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
