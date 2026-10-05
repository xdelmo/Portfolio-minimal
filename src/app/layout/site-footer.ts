import { ChangeDetectionStrategy, Component, afterNextRender, inject, signal } from '@angular/core';
import { CONTENT } from '../content/content';

/**
 * The end of every page: the year, a way back up, my profiles, and the door to the easter egg (craft.wild.as closes
 * with a game too). The email is a link named "Email", so the home page does not print the address twice.
 */
@Component({
  selector: 'app-site-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="site-footer container band band--ink">
      <p>© {{ year }} {{ content.person.name }}</p>
      <ul>
        <li><a href="#main" (click)="toTop($event)" i18n="@@footer.top">Back to top</a></li>
        <li><a [href]="'mailto:' + content.person.email" i18n="@@footer.email">Email</a></li>
        <li><a [href]="content.person.linkedin" rel="me">LinkedIn</a></li>
        <li><a [href]="content.person.github" rel="me">GitHub</a></li>
        @if (ready()) {
          <!-- game-trigger.ts listens for clicks on [data-press-start]; it needs JavaScript, so it appears only then -->
          <li><button type="button" class="press-start" data-press-start i18n="@@footer.pressStart">Press start</button></li>
        }
      </ul>
    </footer>
  `,
  styles: `
    .site-footer {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
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
    // a small key, like the pixel tags: the way into the game for anyone without a keyboard code
    .press-start {
      min-height: 32px;
      padding: 0 var(--space-1);
      border: 2px solid var(--fg);
      background: transparent;
      color: var(--fg);
      font: inherit;
      font-weight: 600;
      cursor: pointer;
    }
    .press-start:hover {
      background: var(--fg);
      color: var(--bg);
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

  // <base href="/en/"> would resolve "#main" to the home page: scroll in place and move the focus to the content
  protected toTop(event: Event): void {
    event.preventDefault();
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'instant' : 'smooth' });
    document.getElementById('main')?.focus({ preventScroll: true });
  }
}
