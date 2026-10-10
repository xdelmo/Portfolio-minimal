import { DOCUMENT, Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { THEME_STORAGE_KEY, Theme, readStoredTheme, resolveTheme } from './theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT);
  private readonly win = isPlatformBrowser(inject(PLATFORM_ID)) ? this.doc.defaultView : null;
  private readonly current = signal<Theme>('light');
  private explicitChoice = false;

  readonly theme = this.current.asReadonly();

  constructor() {
    if (!this.win) return;
    const stored = readStoredTheme(this.storage());
    this.explicitChoice = stored === 'light' || stored === 'dark';
    // matchMedia is missing in some non-browser environments (e.g. jsdom)
    const query = typeof this.win.matchMedia === 'function' ? this.win.matchMedia('(prefers-color-scheme: dark)') : null;
    this.apply(resolveTheme(stored, query?.matches ?? false));
    query?.addEventListener('change', (event) => {
      if (!this.explicitChoice) this.apply(event.matches ? 'dark' : 'light');
    });
  }

  toggle(): void {
    const next: Theme = this.current() === 'dark' ? 'light' : 'dark';
    this.explicitChoice = true;
    try {
      this.storage()?.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // storage blocked: the choice lasts until the page is closed
    }
    this.apply(next);
  }

  private apply(theme: Theme): void {
    this.current.set(theme);
    this.doc.documentElement.dataset['theme'] = theme;
    // the browser bar matches the page (issue #134)
    const bg = this.win?.getComputedStyle(this.doc.documentElement).getPropertyValue('--bg').trim();
    if (bg) this.doc.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg);
  }

  private storage(): Storage | undefined {
    try {
      return this.win?.localStorage;
    } catch {
      return undefined;
    }
  }
}
