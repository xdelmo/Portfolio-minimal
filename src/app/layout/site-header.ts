import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { currentUrl, inPageHref } from '../core/current-url';
import { LanguageSwitch } from '../core/i18n/language-switch';
import { ThemeToggle } from '../core/theme/theme-toggle';
import { PauseToggle } from './pause-toggle';
import { SiteMenu } from './site-menu';

@Component({
  selector: 'app-site-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LanguageSwitch, ThemeToggle, PauseToggle, SiteMenu],
  template: `
    <a class="skip-link" [attr.href]="toMain()" (click)="skipToMain($event)" i18n="@@a11y.skip">Skip to content</a>
    <header class="site-header container">
      <a class="logo" routerLink="/" i18n-aria-label="@@nav.home" aria-label="Emanuele Del Monte, home"
        ><span class="mark" translate="no">edm.</span><span class="name" translate="no"><span>Emanuele</span><span>Del Monte</span></span></a
      >
      <nav i18n-aria-label="@@nav.label" aria-label="Main">
        <a data-magnetic routerLink="/" fragment="work" i18n="@@nav.work">Work</a>
        <a data-magnetic routerLink="/" fragment="about" i18n="@@nav.about">About</a>
        <a data-magnetic routerLink="/" fragment="experience" i18n="@@nav.experience">Experience</a>
        <a data-magnetic routerLink="/" fragment="contact" i18n="@@nav.contact">Contact</a>
      </nav>
      <div class="controls">
        <app-language-switch />
        <app-pause-toggle />
        <app-theme-toggle />
        <app-site-menu class="menu" />
      </div>
    </header>
  `,
  styles: `
    @use 'styles/breakpoints' as bp;

    /* always on screen: sticky over the page, under the intro (z 100) */
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
      gap: var(--space-2);
      min-height: var(--header-h);
    }
    // the mark, a rule, then the full name on two lines: the site signed like a letterhead
    .logo {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      margin-right: auto;
      // touch screens: a 44px target (issue #130)
      @media (pointer: coarse) {
        min-height: 44px;
      }
      color: var(--fg);
      text-decoration: none;
    }
    .mark {
      font-size: var(--step-1);
      font-weight: 700;
    }
    .name {
      display: grid;
      padding-left: var(--space-1);
      border-left: 1px solid var(--rule);
      font-size: 0.75rem;
      font-weight: 500;
      line-height: 1.3;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      white-space: nowrap;
    }
    // small phones get a smaller name, the narrowest keep the mark alone: the controls need the room
    @media (max-width: 389px) {
      .name {
        font-size: 0.625rem;
        letter-spacing: 0.02em;
      }
    }
    @media (max-width: 359px) {
      .name {
        display: none;
      }
    }
    nav {
      display: none;
      gap: var(--space-3);
    }
    nav a {
      color: var(--fg);
      text-decoration: none;
      // a two-word item ("Chi sono") must stay on one line, also while its letters scramble
      white-space: nowrap;
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
      // the links are in the header itself from here
      .menu {
        display: none;
      }
      // room to breathe once the header is wide
      .logo {
        gap: var(--space-2);
      }
      .site-header {
        gap: var(--space-3);
      }
      .name {
        padding-left: var(--space-2);
        letter-spacing: 0.12em;
      }
    }
  `,
})
export class SiteHeader {
  private readonly url = currentUrl();
  protected readonly toMain = computed(() => inPageHref(this.url(), 'main'));

  // with JavaScript, move the focus in place

  skipToMain(event: Event): void {
    event.preventDefault();
    document.getElementById('main')?.focus();
  }
}
