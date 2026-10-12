import { ChangeDetectionStrategy, Component, DestroyRef, afterNextRender, inject, input, signal } from '@angular/core';

/** How long the button says "Copied" before it offers to copy again. */
export const COPIED_MS = 2000;

/**
 * A code block of a blog post (issue #191): ink on paper in a hard frame, scrolling sideways inside itself (focusable,
 * so the keyboard scrolls it too), with a copy button on the frame's top edge. The button appears once the page runs and
 * the browser offers a clipboard, so it never sits there doing nothing; copied, its icon steps into a tick.
 */
@Component({
  selector: 'app-code-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (canCopy()) {
      <button type="button" class="copy" [class.is-copied]="copied()" (click)="copy()">
        @if (copied()) {
          <svg viewBox="0 0 8 8" width="16" height="16" shape-rendering="crispEdges" aria-hidden="true">
            <path fill="currentColor" d="M7 1h1v2H7zM6 3h1v1H6zM5 4h1v1H5zM4 5h1v1H4zM3 6h1v1H3zM2 5h1v1H2zM1 4h1v1H1zM0 3h1v1H0z" />
          </svg>
          <span i18n="@@blog.copied">Copied</span>
        } @else {
          <svg viewBox="0 0 8 8" width="16" height="16" shape-rendering="crispEdges" aria-hidden="true">
            <path fill="currentColor" fill-rule="evenodd" d="M0 0h6v1H1v5H0zM2 2h6v6H2zM3 3v4h4V3z" />
          </svg>
          <span i18n="@@blog.copy">Copy code</span>
        }
      </button>
    }
    <pre tabindex="0"><code [class]="lang() ? 'language-' + lang() : null">{{ code() }}</code></pre>
    <span class="visually-hidden" role="status">
      @if (copied()) {
        <span i18n="@@blog.copiedStatus">Code copied</span>
      }
    </span>
  `,
  styles: `
    :host {
      display: grid;
      min-width: 0;
    }
    pre {
      max-width: 100%;
      margin: 0;
      overflow-x: auto;
      padding: var(--space-2);
      border: 2px solid var(--fg);
      background: var(--surface);
      line-height: 1.5;
      tab-size: 2;
    }
    code {
      font-family: ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace;
      font-size: var(--step--1);
    }
    // a tab on the frame's top right edge: it never covers the first line of code
    .copy {
      justify-self: end;
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      min-height: 32px;
      margin-bottom: -2px;
      padding: 0 var(--space-1);
      border: 2px solid var(--fg);
      border-bottom: 0;
      background: var(--surface);
      color: var(--fg);
      font: inherit;
      font-size: var(--step--1);
      cursor: pointer;
    }
    .copy:hover span {
      text-decoration: underline;
    }
    .copy.is-copied {
      background: var(--accent);
      border-color: var(--accent);
      color: var(--on-accent);
    }
    // copied: the tick lands in three pixel steps, like a lit node of the thread
    @media (prefers-reduced-motion: no-preference) {
      .copy.is-copied svg {
        animation: copied 0.24s steps(3);
      }
    }
    @keyframes copied {
      from {
        transform: scale(2) rotate(-45deg);
      }
    }
  `,
})
export class CodeBlock {
  readonly code = input.required<string>();
  readonly lang = input<string>();
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
      await navigator.clipboard.writeText(this.code());
    } catch {
      return;
    }
    this.copied.set(true);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.copied.set(false);
    }, COPIED_MS);
  }
}
