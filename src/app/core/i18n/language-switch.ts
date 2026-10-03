import { ChangeDetectionStrategy, Component, DOCUMENT, LOCALE_ID, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';
import { Locale, localizedUrl, toLocale } from './locale';

@Component({
  selector: 'app-language-switch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="language-switch" [href]="href()" [attr.hreflang]="target" [attr.lang]="target" (click)="remember()">
      {{ targetName }}
    </a>
  `,
  styles: `
    .language-switch {
      display: inline-grid;
      place-items: center;
      min-width: 48px;
      min-height: 48px;
      color: var(--fg);
      font-weight: 600;
    }
  `,
})
export class LanguageSwitch {
  private readonly router = inject(Router);
  private readonly doc = inject(DOCUMENT);

  protected readonly target: Locale = toLocale(inject(LOCALE_ID)) === 'it' ? 'en' : 'it';
  protected readonly targetName = this.target === 'it' ? 'Italiano' : 'English';

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
}
