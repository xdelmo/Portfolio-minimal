import { ChangeDetectionStrategy, Component, DestroyRef, afterNextRender, computed, inject, input, signal } from '@angular/core';

/** How long the button says "Copied" before it offers to copy again. */
export const COPIED_MS = 2000;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Lightweight token highlighter without external dependencies; strictly follows "No green anywhere". */
export function highlightCode(raw: string, lang?: string): string {
  if (!lang || !['ts', 'typescript', 'js', 'javascript', 'java'].includes(lang.toLowerCase())) {
    return escapeHtml(raw);
  }
  const tokenRegex = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(@\w+)|(\b(?:export|import|from|class|interface|type|const|let|var|function|return|new|if|else|switch|case|default|for|while|do|break|continue|try|catch|finally|throw|async|await|yield|public|private|protected|readonly|static|abstract|implements|extends|override|package|void|enum|super|this)\b)|(\b(?:string|number|boolean|any|unknown|never|void|null|undefined|Record|Array|Promise|Observable|Signal|WritableSignal|int|long|double|float|char|byte|short|String|List|Map|Set)\b)|(\b\d+(?:\.\d+)?\b|\btrue\b|\bfalse\b)/g;

  let lastIndex = 0;
  let html = '';
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(raw)) !== null) {
    if (match.index > lastIndex) {
      html += escapeHtml(raw.slice(lastIndex, match.index));
    }
    const [full, comment, str, decorator, keyword, type, numOrBool] = match;
    if (comment) {
      html += `<span class="tok-com">${escapeHtml(comment)}</span>`;
    } else if (str) {
      html += `<span class="tok-str">${escapeHtml(str)}</span>`;
    } else if (decorator) {
      html += `<span class="tok-dec">${escapeHtml(decorator)}</span>`;
    } else if (keyword) {
      html += `<span class="tok-kw">${escapeHtml(keyword)}</span>`;
    } else if (type) {
      html += `<span class="tok-type">${escapeHtml(type)}</span>`;
    } else if (numOrBool) {
      html += `<span class="tok-num">${escapeHtml(numOrBool)}</span>`;
    } else {
      html += escapeHtml(full);
    }
    lastIndex = match.index + full.length;
  }
  if (lastIndex < raw.length) {
    html += escapeHtml(raw.slice(lastIndex));
  }
  return html;
}

/**
 * A code block of a blog post (issue #191, issue #315): ink on paper in a hard frame, scrolling sideways inside itself
 * (focusable, so the keyboard scrolls it too), with a language indicator tag and a copy button on the frame's top edge.
 * The button appears once the page runs and the browser offers a clipboard, so it never sits there doing nothing;
 * copied, its icon steps into a tick.
 */
@Component({
  selector: 'app-code-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="code-bar">
      @if (lang(); as l) {
        <span class="lang-tag">{{ l }}</span>
      } @else {
        <span class="lang-tag">code</span>
      }
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
    </div>
    <pre tabindex="0"><code [class]="lang() ? 'language-' + lang() : null" [innerHTML]="highlightedCode()"></code></pre>
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
    .code-bar {
      display: flex;
      justify-content: space-between;
      align-items: stretch;
      min-height: 32px;
      margin-bottom: -2px;
    }
    .lang-tag {
      display: inline-flex;
      align-items: center;
      padding: 0 var(--space-1);
      border: 2px solid var(--fg);
      border-bottom: 0;
      background: var(--surface);
      color: var(--fg-muted);
      font-family: var(--font-mono);
      font-size: var(--step--2);
      font-weight: 600;
    }
    @media (pointer: coarse) {
      .code-bar,
      .copy,
      .lang-tag {
        min-height: 44px;
      }
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
      font-family: var(--font-mono);
      font-size: var(--step--1);
    }
    .tok-kw {
      color: var(--link);
      font-weight: 600;
    }
    .tok-str {
      color: var(--accent);
    }
    .tok-com {
      color: var(--fg-muted);
      font-style: italic;
    }
    .tok-dec {
      color: var(--accent);
    }
    .tok-type {
      color: var(--fg);
      font-weight: 500;
    }
    .tok-num {
      color: var(--fg);
      font-weight: 600;
    }
    // a tab on the frame's top right edge: it never covers the first line of code
    .copy {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      min-height: 32px;
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
  protected readonly highlightedCode = computed(() => highlightCode(this.code(), this.lang()));
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
