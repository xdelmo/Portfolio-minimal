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
  templateUrl: './code-block.html',
  styleUrl: './code-block.scss',
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
