import { DOCUMENT, Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'theme';

export function resolveTheme(stored: string | null, prefersDark: boolean): Theme {
  if (stored === 'light' || stored === 'dark') return stored;
  return prefersDark ? 'dark' : 'light';
}

/** What to store after a toggle: nothing when the new theme is the system's, so the site follows the system again (issue #581). */
export function storedAfterToggle(next: Theme, prefersDark: boolean): Theme | null {
  return next === (prefersDark ? 'dark' : 'light') ? null : next;
}

export function readStoredTheme(storage: Pick<Storage, 'getItem'> | undefined): string | null {
  try {
    return storage?.getItem(THEME_STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT);
  private readonly win = isPlatformBrowser(inject(PLATFORM_ID)) ? this.doc.defaultView : null;
  private readonly current = signal<Theme>('light');
  private explicitChoice = false;
  private query: MediaQueryList | null = null;

  readonly theme = this.current.asReadonly();

  constructor() {
    if (!this.win) return;
    const stored = readStoredTheme(this.storage());
    this.explicitChoice = stored === 'light' || stored === 'dark';
    // matchMedia is missing in some non-browser environments (e.g. jsdom)
    const query = typeof this.win.matchMedia === 'function' ? this.win.matchMedia('(prefers-color-scheme: dark)') : null;
    this.query = query;
    this.apply(resolveTheme(stored, query?.matches ?? false));
    query?.addEventListener('change', (event) => {
      if (!this.explicitChoice) this.apply(event.matches ? 'dark' : 'light');
    });
    // a toggle in another tab reaches this one
    this.win.addEventListener('storage', (event) => {
      if (event.storageArea !== this.storage() || (event.key !== THEME_STORAGE_KEY && event.key !== null)) return;
      this.explicitChoice = event.newValue === 'light' || event.newValue === 'dark';
      this.apply(resolveTheme(event.newValue, this.query?.matches ?? false));
    });
  }

  toggle(): void {
    const next: Theme = this.current() === 'dark' ? 'light' : 'dark';
    const stored = storedAfterToggle(next, this.query?.matches ?? false);
    this.explicitChoice = stored !== null;
    try {
      if (stored) this.storage()?.setItem(THEME_STORAGE_KEY, stored);
      else this.storage()?.removeItem(THEME_STORAGE_KEY);
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
