import { EnvironmentProviders, InjectionToken, LOCALE_ID, inject, provideAppInitializer } from '@angular/core';
import { toLocale } from '../core/i18n/locale';
import { SiteContent } from './content.model';
import { PUBLIC_REPOS } from './public-repos.generated';
import { onlyPublic } from './public-repos';

// Each language is its own lazy chunk (issue #359): imported statically, both sat in `main` and every page shipped the
// other language's 17 KB it never read.
const LOADERS = {
  en: () => import('./content.en').then((m) => m.CONTENT_EN),
  it: () => import('./content.it').then((m) => m.CONTENT_IT),
};

const LOADED = new InjectionToken<{ value?: SiteContent }>('LOADED_CONTENT', { providedIn: 'root', factory: () => ({}) });

/** Loads the page's language before the app starts, so `CONTENT` stays a plain synchronous token. */
export function provideContent(): EnvironmentProviders {
  return provideAppInitializer(async () => {
    const loaded = inject(LOADED);
    const content = await LOADERS[toLocale(inject(LOCALE_ID))]();
    loaded.value = onlyPublic(content, (url) => PUBLIC_REPOS.includes(url));
  });
}

export const CONTENT = new InjectionToken<SiteContent>('CONTENT', {
  providedIn: 'root',
  factory: () => {
    const { value } = inject(LOADED);
    if (!value) throw new Error('CONTENT read before provideContent() loaded it');
    return value;
  },
});
