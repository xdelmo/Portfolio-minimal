import { ChangeDetectionStrategy, Component, DOCUMENT, ElementRef, LOCALE_ID, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';
import { Locale, localizedUrl, toLocale } from './locale';

@Component({
  selector: 'app-language-switch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:click)': 'closeOutside($event)', '(keydown.escape)': 'close()' },
  template: `
    <details class="language-menu">
      <summary>
        <svg viewBox="0 0 8 8" width="16" height="16" shape-rendering="crispEdges" aria-hidden="true">
          <path fill="currentColor" d="M2 0h4v1H2zM1 1h1v1H1zM6 1h1v1H6zM0 2h1v4H0zM7 2h1v4H7zM1 6h1v1H1zM6 6h1v1H6zM2 7h4v1H2zM3 1h2v6H3zM1 3h6v2H1z" />
        </svg>
        <span><span class="visually-hidden" i18n="@@lang.label">Language:</span> {{ names[current] }}</span>
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
              <a [href]="href()" [attr.hreflang]="locale" [attr.lang]="locale" (click)="remember()">{{ names[locale] }}</a>
            }
          </li>
        }
      </ul>
    </details>
  `,
  styles: `
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
    summary::-webkit-details-marker {
      display: none;
    }
    .chevron {
      transition: transform 0.2s ease;
    }
    [open] .chevron {
      transform: rotate(180deg);
    }
    ul {
      position: absolute;
      top: 100%;
      right: 0;
      z-index: 1;
      min-width: 10rem;
      margin: 0;
      padding: var(--space-1) 0;
      list-style: none;
      background: var(--surface);
      box-shadow: 0 0 0 1px var(--rule);
    }
    li > * {
      display: flex;
      align-items: center;
      min-height: 44px;
      padding-inline: var(--space-2);
      color: var(--fg);
    }
    a:hover {
      background: var(--bg);
    }
    [aria-current] {
      font-weight: 600;
    }
    [aria-current]::after {
      content: '';
      width: 6px;
      height: 6px;
      margin-left: auto;
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

  protected remember(): void {
    this.doc.cookie = `nf_lang=${this.target}; path=/; max-age=31536000; samesite=lax`;
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
