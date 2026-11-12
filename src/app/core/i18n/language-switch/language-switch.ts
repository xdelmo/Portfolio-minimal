import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, DOCUMENT, ElementRef, LOCALE_ID, computed, inject, input } from '@angular/core';
import { currentUrl } from '../../current-url';
import { Locale, localizedUrl, toLocale } from '../locale';
import { HELLO_KEY } from '../../../voxel/moai-cues';

/** Matches the `lang-cover` animation in styles/_base.scss. */
const COVER_MS = 500;

@Component({
  selector: 'app-language-switch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  host: {
    '(document:click)': 'closeOutside($event)',
    '(keydown.escape)': 'close()',
    '(window:pageshow)': 'uncover($event)',
  },
  templateUrl: './language-switch.html',
  styleUrl: './language-switch.scss',
})
export class LanguageSwitch {
  private readonly doc = inject(DOCUMENT);
  /** Both languages as a row instead of a dropdown (the phone menu's panel, issue #193). */
  readonly inline = input(false);

  protected readonly locales: readonly Locale[] = ['en', 'it'];
  protected readonly names: Record<Locale, string> = { en: 'English', it: 'Italiano' };
  protected readonly current: Locale = toLocale(inject(LOCALE_ID));
  private readonly target: Locale = this.current === 'it' ? 'en' : 'it';
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  private readonly url = currentUrl();

  protected readonly href = computed(() => localizedUrl(this.url(), this.target));

  /** Remembers the choice and, motion allowed, covers the page before leaving (index.html lifts it on arrival). */
  protected switchTo(event: MouseEvent): void {
    this.doc.cookie = `nf_lang=${this.target}; path=/; max-age=31536000; samesite=lax`;
    const win = this.doc.defaultView;
    try {
      // the moai on the page it opens says hello (issue #393)
      win?.sessionStorage.setItem(HELLO_KEY, '1');
    } catch {
      // no storage: no hello
    }
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
    menu.querySelector('summary')?.focus({ preventScroll: true });
  }

  protected closeOutside(event: Event): void {
    const menu = this.host.nativeElement.querySelector('details');
    if (menu?.open && !menu.contains(event.target as Node)) menu.open = false;
  }
}
