import { ChangeDetectionStrategy, Component, DestroyRef, afterNextRender, inject, input, signal } from '@angular/core';

/** How long the button says "Copied" before it offers to copy again. */
export const COPIED_MS = 2000;

/**
 * A button under the contact title that copies the email address, for a desktop with no mail app where the title's
 * mailto link does nothing (issue #90). The address itself stays unprinted (removed on request). The button exists only
 * once the page is running and the browser offers a clipboard, so it never sits there doing nothing.
 */
@Component({
  selector: 'app-email-line',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (canCopy()) {
      <button type="button" class="repo-link" (click)="copy()">
        @if (copied()) {
          <span i18n="@@home.contact.copied">Copied</span>
        } @else {
          <span i18n="@@home.contact.copy">Copy the email address</span>
        }
      </button>
    }
    <span class="visually-hidden" role="status">
      @if (copied()) {
        <span i18n="@@home.contact.copiedStatus">Email address copied</span>
      }
    </span>
  `,
  styles: `
    /* the profile tags' look; a button needs the font reset a link does not */
    .repo-link {
      font-family: inherit;
      cursor: pointer;
    }
    .repo-link:not(:hover) {
      background: none;
    }
  `,
})
export class EmailLine {
  readonly email = input.required<string>();
  protected readonly canCopy = signal(false);
  protected readonly copied = signal(false);
  private timer = 0;

  constructor() {
    afterNextRender(() => {
      // missing on older browsers and outside a secure context, whatever the DOM types say
      this.canCopy.set(typeof (navigator.clipboard as Clipboard | undefined)?.writeText === 'function');
    });
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.timer);
    });
  }

  protected async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.email());
    } catch {
      // permission refused: the address is still on screen to select by hand
      return;
    }
    this.copied.set(true);
    clearTimeout(this.timer);
    this.timer = window.setTimeout(() => {
      this.copied.set(false);
    }, COPIED_MS);
  }
}
