import { ChangeDetectionStrategy, Component, afterNextRender, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { currentUrl, inPageHref } from '../core/current-url';
import { CONTENT } from '../content/content';

/**
 * The end of every page: the year, a way back up, my profiles, the privacy page, and the door to the easter egg (craft.wild.as closes
 * with a game too). The email is a link named "Email", so the home page does not print the address twice.
 */
@Component({
  selector: 'app-site-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <footer class="site-footer container band band--ink">
      <p>© {{ year }} {{ content.person.name }}</p>
      <a class="to-top" [attr.href]="toMain()" (click)="toTop($event)"
        ><span i18n="@@footer.top">Back to top</span
        ><svg viewBox="0 0 8 8" shape-rendering="crispEdges" fill="currentColor" aria-hidden="true" focusable="false">
          <path d="M3 0h2v1h-2zM2 1h4v1h-4zM1 2h6v1h-6zM0 3h2v1h-2zM3 3h2v5h-2zM6 3h2v1h-2z" /></svg
      ></a>
      <ul>
        <li><a [href]="'mailto:' + content.person.email" i18n="@@footer.email">Email</a></li>
        <li><a [href]="content.person.linkedin" target="_blank" aria-describedby="new-tab" rel="me noopener">LinkedIn</a></li>
        <li><a [href]="content.person.github" target="_blank" aria-describedby="new-tab" rel="me noopener">GitHub</a></li>
        <li><a routerLink="/privacy" i18n="@@footer.privacy">Privacy</a></li>
        @if (ready()) {
          <!-- game-trigger.ts listens for clicks on [data-press-start]; it needs JavaScript, so it appears only then -->
          <li>
            <button type="button" class="press-start" data-press-start i18n-aria-label="@@footer.pressStart" aria-label="Press start">
              <svg class="key" viewBox="0 0 16 8" shape-rendering="crispEdges" aria-hidden="true" focusable="false">
                <path class="fill" d="M1 1h7v1h-7zM1 2h9v1h-9zM1 3h11v1h-11zM1 4h11v1h-11zM1 5h9v1h-9zM1 6h7v1h-7z" />
                <path class="line" d="M0 0h8v1h-8zM0 1h1v1h-1zM8 1h2v1h-2zM0 2h1v1h-1zM10 2h2v1h-2zM0 3h1v1h-1zM12 3h2v1h-2zM0 4h1v1h-1zM12 4h2v1h-2zM0 5h1v1h-1zM10 5h2v1h-2zM0 6h1v1h-1zM8 6h2v1h-2zM0 7h8v1h-8z" />
              </svg>
              <span i18n="@@footer.start">Start</span>
            </button>
          </li>
        }
      </ul>
    </footer>
  `,
  styles: `
    @use 'styles/breakpoints' as bp;

    // the year on the left, the way back up in the middle, the links on the right
    .site-footer {
      display: grid;
      justify-items: start;
      align-items: center;
      gap: var(--space-2);
      padding-block: var(--space-6);
      border-top: 1px solid var(--rule);
      color: var(--fg-muted);
      font-size: var(--step--1);
    }
    p {
      margin: 0;
    }
    .to-top {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
    }
    .to-top svg {
      width: 12px;
      height: 12px;
      transition: translate 0.2s steps(2);
    }
    .to-top:hover svg {
      translate: 0 -4px;
    }
    @include bp.up(md) {
      .site-footer {
        grid-template-columns: 1fr auto 1fr;
      }
      .to-top {
        justify-self: center;
      }
      ul {
        justify-self: end;
      }
    }
    ul {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-3);
      margin: 0;
      padding: 0;
      list-style: none;
    }
    a {
      display: inline-block;
      min-height: 24px;
    }
    // the console's start key, drawn in pixels: a small outline pointing right, "Start" beside it, on the line of the
    // links (the button is named "Press start", like the card it opens; only the shape is borrowed: no logos, no
    // face-button symbols). An easter egg should be found, not shout: it fills only under the pointer or when pressed
    .press-start {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      min-height: 24px;
      padding: 0;
      border: 0;
      background: none;
      color: var(--link);
      font: inherit;
      cursor: pointer;
    }
    .key {
      display: block;
      flex: none;
      width: 32px;
      height: 16px;
    }
    .line {
      fill: currentColor;
    }
    .fill {
      fill: transparent;
    }
    .press-start:hover .fill,
    .press-start:focus-visible .fill,
    .press-start:active .fill {
      fill: currentColor;
    }
    .press-start:active .key {
      translate: 0 2px;
    }
    @media (prefers-reduced-motion: no-preference) {
      .key {
        transition: translate 80ms steps(2);
      }
    }
  `,
})
export class SiteFooter {
  protected readonly content = inject(CONTENT);
  protected readonly year = new Date().getFullYear();
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
