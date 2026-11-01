import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { currentUrl, inPageHref } from '../core/current-url';
import { LanguageSwitch } from '../core/i18n/language-switch';
import { ThemeToggle } from '../core/theme/theme-toggle';
import { PauseToggle } from './pause-toggle';
import { SiteMenu } from './site-menu';

@Component({
  selector: 'app-site-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, LanguageSwitch, ThemeToggle, PauseToggle, SiteMenu],
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
        <a data-magnetic routerLink="/blog" routerLinkActive ariaCurrentWhenActive="page" i18n="@@nav.blog">Blog</a>
      </nav>
      <div class="controls">
        <app-language-switch />
        <app-pause-toggle />
        <app-theme-toggle />
      </div>
      <!-- the bar's one action, on every width and page; outside the nav so the menu's letter scramble leaves it alone -->
      <a class="button button--primary cta" data-magnetic routerLink="/" fragment="contact" i18n="@@home.cta.contact">Contact me</a>
      <app-site-menu class="menu" />
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
      gap: var(--space-1);
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
    // phones and tablets: the mark alone (issue #193: asked for phones; at 768px the name, five links and the controls
    // ran 96px past the edge); the full name signs the bar from 1024px
    .name {
      display: none;
      padding-left: var(--space-1);
      border-left: 1px solid var(--rule);
      font-size: 0.75rem;
      font-weight: 500;
      line-height: 1.3;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      white-space: nowrap;
    }
    nav {
      display: none;
      gap: var(--space-2);
    }
    nav a {
      position: relative;
      display: inline-flex;
      align-items: center;
      min-height: 48px;
      color: var(--fg);
      text-decoration: none;
      // a two-word item ("Chi sono") must stay on one line, also while its letters scramble
      white-space: nowrap;
    }
    // one underline for hover and for the section you are in (issue #229): a hard 2px line that draws itself in steps
    nav a::after {
      content: '';
      position: absolute;
      inset-inline: 0;
      bottom: var(--space-1);
      height: 2px;
      background: currentColor;
      transform: scaleX(0);
      transform-origin: left;
    }
    nav a:hover::after,
    nav a[aria-current]::after {
      transform: scaleX(1);
    }
    @media (hover: hover) and (prefers-reduced-motion: no-preference) {
      nav a::after {
        transition: transform 120ms steps(4);
      }
    }
    .controls {
      display: none;
      align-items: center;
    }
    // phones: a compact key, a repository tag's size in the primary colours, between the mark and the menu button
    .cta {
      flex: none;
      min-height: 40px;
      padding-inline: var(--space-2);
      font-size: var(--step--1);
      white-space: nowrap;
      @media (pointer: coarse) {
        min-height: 44px;
      }
    }
    // the menu button's bars line up with the gutter; its 48px target runs on to the edge of the screen
    .menu {
      margin-right: calc(-1 * var(--space-2));
    }
    @include bp.up(md) {
      nav,
      .controls {
        display: flex;
      }
      // the links and the controls are in the header itself from here
      .menu {
        display: none;
      }
      // room to breathe once the header is wide
      .logo {
        gap: var(--space-2);
      }
      .site-header {
        gap: var(--space-2);
      }
      .name {
        padding-left: var(--space-2);
        letter-spacing: 0.12em;
      }
      .cta {
        min-height: 48px;
        font-size: inherit;
      }
    }
    @include bp.up(lg) {
      .name {
        display: grid;
      }
      nav,
      .site-header {
        gap: var(--space-3);
      }
      // the full button of the design system once the bar has room for it
      .cta {
        padding-inline: var(--space-3);
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
