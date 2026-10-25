import { ChangeDetectionStrategy, Component, DestroyRef, afterNextRender, inject, signal } from '@angular/core';
import { CONTENT } from '../content/content';

/**
 * Copies the email address, for a visitor whose browser has no mail program behind the mailto link (issue #231). The
 * address itself stays off the page, as asked: the button says what it copies. Like the code blocks' copy button, it
 * appears once the page runs and the browser offers a clipboard, so it never sits there doing nothing.
 */
@Component({
  selector: 'app-copy-email',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (canCopy()) {
      <button type="button" class="repo-link" [class.is-copied]="copied()" (click)="copy()">
        @if (copied()) {
          <svg viewBox="0 0 8 8" width="16" height="16" shape-rendering="crispEdges" aria-hidden="true">
            <path fill="currentColor" d="M7 1h1v2H7zM6 3h1v1H6zM5 4h1v1H5zM4 5h1v1H4zM3 6h1v1H3zM2 5h1v1H2zM1 4h1v1H1zM0 3h1v1H0z" />
          </svg>
          <span i18n="@@contact.copied">Copied</span>
        } @else {
          <svg viewBox="0 0 8 8" width="16" height="16" shape-rendering="crispEdges" aria-hidden="true">
            <path fill="currentColor" fill-rule="evenodd" d="M0 0h6v1H1v5H0zM2 2h6v6H2zM3 3v4h4V3z" />
          </svg>
          <span i18n="@@contact.copy">Copy my email address</span>
        }
      </button>
      <span class="visually-hidden" role="status">
        @if (copied()) {
          <span i18n="@@contact.copiedStatus">Email address copied</span>
        }
      </span>
    }
  `,
  styles: `
    button {
      background: none;
      font-family: inherit;
      cursor: pointer;
    }
    .is-copied {
      border-color: var(--link);
      background: var(--link);
      color: var(--band-bg, var(--bg));
    }
  `,
})
export class CopyEmail {
  private readonly email = inject(CONTENT).person.email;
  protected readonly canCopy = signal(false);
  protected readonly copied = signal(false);
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    afterNextRender(() => {
      this.canCopy.set(typeof (navigator.clipboard as Clipboard | undefined)?.writeText === 'function');
    });
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.timer);
    });
  }

  protected async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.email);
    } catch {
      return;
    }
    this.copied.set(true);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.copied.set(false);
    }, 2000);
  }
}
