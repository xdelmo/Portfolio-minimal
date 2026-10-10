import { ChangeDetectionStrategy, Component, ElementRef, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * The sections, behind a button, on phones (issue #128): below 768px the header has no room for its links, and the
 * home page is about 11,000px tall. A <details>, like the language menu: it opens before the app boots too. Escape,
 * a tap outside or a link close it.
 */
@Component({
  selector: 'app-site-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  host: {
    '(document:click)': 'closeOutside($event)',
    '(keydown.escape)': 'close(true)',
    // tabbing out of the open menu closes it, so it never covers the control that has the focus (WCAG 2.4.11)
    '(focusout)': 'closeOnLeave($event)',
  },
  template: `
    <details class="site-menu">
      <summary>
        <span class="visually-hidden" i18n="@@nav.menu">Menu</span>
        <svg class="bars" viewBox="0 0 8 8" width="16" height="16" shape-rendering="crispEdges" aria-hidden="true">
          <path fill="currentColor" d="M0 1h8v1H0zM0 3.5h8v1H0zM0 6h8v1H0z" />
        </svg>
        <svg class="cross" viewBox="0 0 8 8" width="16" height="16" shape-rendering="crispEdges" aria-hidden="true">
          <path fill="currentColor" d="M0 0h2v1H0zM6 0h2v1H6zM1 1h2v1H1zM5 1h2v1H5zM2 2h2v1H2zM4 2h2v1H4zM3 3h2v2H3zM2 5h2v1H2zM4 5h2v1H4zM1 6h2v1H1zM5 6h2v1H5zM0 7h2v1H0zM6 7h2v1H6z" />
        </svg>
      </summary>
      <nav i18n-aria-label="@@nav.label" aria-label="Main">
        <a routerLink="/" fragment="work" (click)="close(false)" i18n="@@nav.work">Work</a>
        <a routerLink="/" fragment="about" (click)="close(false)" i18n="@@nav.about">About</a>
        <a routerLink="/" fragment="experience" (click)="close(false)" i18n="@@nav.experience">Experience</a>
        <a routerLink="/" fragment="contact" (click)="close(false)" i18n="@@nav.contact">Contact</a>
      </nav>
    </details>
  `,
  styles: `
    summary {
      display: grid;
      place-items: center;
      width: 48px;
      height: 48px;
      color: var(--fg);
      list-style: none;
      cursor: pointer;
    }
    summary::-webkit-details-marker {
      display: none;
    }
    summary svg {
      grid-area: 1 / 1;
      pointer-events: none;
    }
    .cross,
    [open] .bars {
      display: none;
    }
    [open] .cross {
      display: block;
    }
    // under the sticky header, across the screen; the links are big rows, easy to hit with a thumb
    nav {
      position: fixed;
      top: var(--header-h);
      inset-inline: 0;
      display: grid;
      padding: var(--space-1) var(--gutter) var(--space-2);
      background: var(--bg);
      box-shadow: 0 1px 0 var(--rule);
    }
    nav a {
      display: flex;
      align-items: center;
      min-height: 48px;
      color: var(--fg);
      font-size: var(--step-2);
      font-weight: 600;
      font-variation-settings: 'wdth' 85;
      text-decoration: none;
    }
    nav a + a {
      border-top: 1px solid var(--rule);
    }
    // it opens in four pixel steps, like the language curtain
    @media (prefers-reduced-motion: no-preference) {
      [open] nav {
        animation: menu-open 160ms steps(4);
      }
    }
    @keyframes menu-open {
      from {
        clip-path: inset(0 0 100% 0);
      }
    }
  `,
})
export class SiteMenu {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /** `refocus`: Escape gives the focus back to the button; a link moves on to its section instead. */
  protected close(refocus: boolean): void {
    const menu = this.host.querySelector('details');
    if (!menu?.open) return;
    menu.open = false;
    if (refocus) menu.querySelector('summary')?.focus();
  }

  protected closeOnLeave(event: FocusEvent): void {
    if (event.relatedTarget instanceof Node && !this.host.contains(event.relatedTarget)) this.close(false);
  }

  protected closeOutside(event: Event): void {
    const menu = this.host.querySelector('details');
    if (menu?.open && !menu.contains(event.target as Node)) menu.open = false;
  }
}
