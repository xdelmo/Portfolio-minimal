import { ChangeDetectionStrategy, Component, ElementRef, afterNextRender, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CONTENT } from '../../content/content';
import { LanguageSwitch } from '../../core/i18n/language-switch/language-switch';
import { ThemeToggle } from '../../core/theme/theme-toggle';
import { MOTION_LOADER, type MotionLib } from '../../motion/motion-host';
import { MusicToggle } from '../music-toggle';
import { PauseToggle } from '../pause-toggle';

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
 * (issue #183); before GSAP is in, or with reduced motion, it simply appears and disappears. On phones the header's
 * controls live here too, below the links (issue #193): the bar keeps only the signature and this button.
 */
@Component({
  selector: 'app-site-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, LanguageSwitch, PauseToggle, MusicToggle, ThemeToggle],
  host: {
    '(document:click)': 'closeOutside($event)',
    '(keydown.escape)': 'close(true)',
    // tabbing out of the open menu closes it, so it never covers the control that has the focus (WCAG 2.4.11)
    '(focusout)': 'closeOnLeave($event)',
  },
  templateUrl: './site-menu.html',
  styleUrl: './site-menu.scss',
})
export class SiteMenu {
  protected readonly content = inject(CONTENT);
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
    return { nav: menu.querySelector('.panel'), bars: menu.querySelector('.bars'), cross: menu.querySelector('.cross') };
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
    if (refocus) menu.querySelector('summary')?.focus({ preventScroll: true });
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
