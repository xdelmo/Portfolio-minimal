import { ChangeDetectionStrategy, Component, DOCUMENT, ElementRef, LOCALE_ID, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';
import { Locale, localizedUrl, toLocale } from './locale';

/** Matches the `lang-cover` animation in styles/_base.scss. */
const COVER_MS = 500;

@Component({
  selector: 'app-language-switch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'closeOutside($event)',
    '(keydown.escape)': 'close()',
    '(window:pageshow)': 'uncover($event)',
  },
  template: `
    <details class="language-menu">
      <summary>
        <svg viewBox="0 0 8 8" width="16" height="16" shape-rendering="crispEdges" aria-hidden="true">
          <path fill="currentColor" d="M2 0h4v1H2zM1 1h1v1H1zM6 1h1v1H6zM0 2h1v4H0zM7 2h1v4H7zM1 6h1v1H1zM6 6h1v1H6zM2 7h4v1H2zM3 1h2v6H3zM1 3h6v2H1z" />
        </svg>
        <!-- phones show the code, to leave the header room for the name; the full name is still read out -->
        <span class="lang-name"><span class="visually-hidden" i18n="@@lang.label">Language:</span> {{ names[current] }}</span>
        <span class="lang-code" aria-hidden="true">{{ current.toUpperCase() }}</span>
        <svg class="chevron" viewBox="0 0 8 8" width="12" height="12" shape-rendering="crispEdges" aria-hidden="true">
          <path fill="currentColor" d="M1 2h2v1H1zM5 2h2v1H5zM2 3h2v1H2zM4 3h2v1H4zM3 4h2v1H3z" />
        </svg>
      </summary>
      <ul>
        @for (locale of locales; track locale) {
          <li>
            @if (locale === current) {
              <span aria-current="true" [attr.lang]="locale">{{ names[locale] }}</span>
            } @else {
              <a [href]="href()" [attr.hreflang]="locale" [attr.lang]="locale" (click)="switchTo($event)">{{ names[locale] }}</a>
            }
          </li>
        }
      </ul>
    </details>
  `,
  styles: `
    @use 'styles/breakpoints' as bp;

    .language-menu {
      position: relative;
    }
    summary {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      min-height: 48px;
      padding-inline: var(--space-1);
      color: var(--fg);
      font-weight: 600;
      list-style: none;
      cursor: pointer;
    }
    // the whole summary opens the menu: the icons need not catch the pointer (on phones they sit over the hidden name)
    summary svg {
      flex: none;
      pointer-events: none;
    }
    .lang-name {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
    @include bp.up(md) {
      .lang-name {
        position: static;
        width: auto;
        height: auto;
        overflow: visible;
        clip-path: none;
      }
      .lang-code {
        display: none;
      }
    }
    summary::-webkit-details-marker {
      display: none;
    }
    .chevron {
      transition: transform 0.2s ease;
    }
    [open] .chevron {
      transform: rotate(180deg);
    }
    /* the items' text lines up with the summary's label (8px padding + 16px icon + 8px gap); the current
       language's square sits in the icon column */
    ul {
      position: absolute;
      top: 100%;
      left: 0;
      z-index: 1;
      min-width: 100%;
      margin: 0;
      padding: 0;
      list-style: none;
      background: var(--surface);
      box-shadow: 0 0 0 1px var(--rule);
    }
    li > * {
      position: relative;
      display: flex;
      align-items: center;
      min-height: 40px;
      padding-inline: var(--space-4) var(--space-2);
      color: var(--fg);
      white-space: nowrap;
    }
    a {
      text-decoration: none;
    }
    a:hover {
      background: var(--bg);
      text-decoration: underline;
    }
    [aria-current] {
      font-weight: 600;
    }
    [aria-current]::before {
      content: '';
      position: absolute;
      left: calc(var(--space-1) + 5px);
      width: 6px;
      height: 6px;
      background: var(--accent);
    }
    @media (prefers-reduced-motion: reduce) {
      .chevron {
        transition: none;
      }
    }
  `,
})
export class LanguageSwitch {
  private readonly router = inject(Router);
  private readonly doc = inject(DOCUMENT);

  protected readonly locales: readonly Locale[] = ['en', 'it'];
  protected readonly names: Record<Locale, string> = { en: 'English', it: 'Italiano' };
  protected readonly current: Locale = toLocale(inject(LOCALE_ID));
  private readonly target: Locale = this.current === 'it' ? 'en' : 'it';
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  protected readonly href = computed(() => localizedUrl(this.url(), this.target));

  /** Remembers the choice and, motion allowed, covers the page before leaving (index.html lifts it on arrival). */
  protected switchTo(event: MouseEvent): void {
    this.doc.cookie = `nf_lang=${this.target}; path=/; max-age=31536000; samesite=lax`;
    const win = this.doc.defaultView;
    const plain = event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
    if (!win || !plain || win.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    event.preventDefault();
    const name = this.names[this.target];
    try {
      win.sessionStorage.setItem('lang-swap', name);
    } catch {
      // no storage: the new page just appears
    }
    const root = this.doc.documentElement;
    root.dataset['langSwap'] = name;
    root.dataset['langPhase'] = 'out';
    const href = (event.currentTarget as HTMLAnchorElement).href;
    win.setTimeout(() => {
      win.location.href = href;
    }, COVER_MS);
  }

  /** Back from the other language through the back/forward cache: the page comes back still covered. */
  protected uncover(event: PageTransitionEvent): void {
    if (!event.persisted) return;
    delete this.doc.documentElement.dataset['langSwap'];
    delete this.doc.documentElement.dataset['langPhase'];
  }

  protected close(): void {
    const menu = this.host.nativeElement.querySelector('details');
    if (!menu?.open) return;
    menu.open = false;
    menu.querySelector('summary')?.focus();
  }

  protected closeOutside(event: Event): void {
    const menu = this.host.nativeElement.querySelector('details');
    if (menu?.open && !menu.contains(event.target as Node)) menu.open = false;
  }
}
