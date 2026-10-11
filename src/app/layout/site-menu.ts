import { ChangeDetectionStrategy, Component, ElementRef, afterNextRender, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MOTION_LOADER, type MotionLib } from '../motion/motion-host';

type Gsap = MotionLib['gsap'];
/** Four pixel steps, like the language curtain; closing is a little quicker than opening. */
const OPEN_S = 0.16;
const CLOSE_S = 0.12;
const SHUT = 'inset(0 0 100% 0)';
const SHOWN = 'inset(0 0 0% 0)';

/**
 * The sections, behind a button, on phones (issue #128): below 768px the header has no room for its links, and the
 * home page is about 11,000px tall. A <details>, like the language menu: it opens before the app boots too. Escape,
 * a tap outside or a link close it. GSAP opens and closes it in pixel steps and turns the bars into the cross and back
 * (issue #183); before GSAP is in, or with reduced motion, it simply appears and disappears.
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
    <details class="site-menu" (toggle)="opened()">
      <summary (click)="toggle($event)">
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
        <a routerLink="/blog" (click)="close(false)" i18n="@@nav.blog">Blog</a>
      </nav>
    </details>
  `,
  styles: `
    summary {
      display: grid;
      place-items: center;
      width: 44px;
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
  `,
})
export class SiteMenu {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private gsap?: Gsap;
  private closing?: ReturnType<Gsap['timeline']>;

  constructor() {
    const load = inject(MOTION_LOADER);
    afterNextRender(() => {
      load().then(
        ({ gsap }) => {
          this.gsap = gsap;
        },
        () => undefined,
      );
    });
  }

  /** GSAP, unless it is not in yet or the visitor asked for reduced motion. */
  private motion(): Gsap | undefined {
    return matchMedia('(prefers-reduced-motion: reduce)').matches ? undefined : this.gsap;
  }

  private parts(menu: HTMLDetailsElement): { nav: HTMLElement | null; bars: SVGElement | null; cross: SVGElement | null } {
    return { nav: menu.querySelector('nav'), bars: menu.querySelector('.bars'), cross: menu.querySelector('.cross') };
  }

  /** Opened: the panel unrolls downwards and the cross turns in. */
  protected opened(): void {
    const menu = this.host.querySelector('details');
    const gsap = this.motion();
    if (!menu?.open || !gsap || this.closing) return;
    const { nav, cross } = this.parts(menu);
    gsap.fromTo(nav, { clipPath: SHUT }, { clipPath: SHOWN, duration: OPEN_S, ease: 'steps(4)', clearProps: 'clipPath' });
    gsap.fromTo(cross, { rotation: -90, scale: 0.25 }, { rotation: 0, scale: 1, duration: OPEN_S, ease: 'steps(4)', clearProps: 'transform' });
  }

  /** The button closes the open menu through `close`, so it can roll up; pressed again while it rolls up, it stays open. */
  protected toggle(event: Event): void {
    const menu = this.host.querySelector('details');
    if (!menu?.open) return;
    event.preventDefault();
    if (this.closing) {
      this.closing.kill();
      this.closing = undefined;
      const { nav, cross } = this.parts(menu);
      this.gsap?.set([nav, cross], { clearProps: 'clipPath,transform' });
    } else {
      this.close(false);
    }
  }

  /** `refocus`: Escape gives the focus back to the button; a link moves on to its section instead. */
  protected close(refocus: boolean): void {
    const menu = this.host.querySelector('details');
    if (!menu?.open || this.closing) return;
    if (refocus) menu.querySelector('summary')?.focus();
    const gsap = this.motion();
    if (!gsap) {
      menu.open = false;
      return;
    }
    const { nav, bars, cross } = this.parts(menu);
    this.closing = gsap
      .timeline({
        onComplete: () => {
          this.closing = undefined;
          menu.open = false;
          gsap.set([nav, cross], { clearProps: 'clipPath,transform' });
          gsap.fromTo(bars, { rotation: 90, scale: 0.25 }, { rotation: 0, scale: 1, duration: CLOSE_S, ease: 'steps(3)', clearProps: 'transform' });
        },
      })
      .to(nav, { clipPath: SHUT, duration: CLOSE_S, ease: 'steps(3)' })
      .to(cross, { rotation: 90, scale: 0.25, duration: CLOSE_S, ease: 'steps(3)' }, 0);
  }

  protected closeOnLeave(event: FocusEvent): void {
    if (event.relatedTarget instanceof Node && !this.host.contains(event.relatedTarget)) this.close(false);
  }

  protected closeOutside(event: Event): void {
    const menu = this.host.querySelector('details');
    if (menu?.open && !menu.contains(event.target as Node)) this.close(false);
  }
}
