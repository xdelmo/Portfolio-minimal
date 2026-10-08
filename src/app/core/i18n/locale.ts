export type Locale = 'en' | 'it';

export function toLocale(localeId: string): Locale {
  return localeId.toLowerCase().startsWith('it') ? 'it' : 'en';
}

/** Same page in the other locale build. `routerUrl` is Router.url (no locale prefix). */
export function localizedUrl(routerUrl: string, target: Locale): string {
  const path = routerUrl.startsWith('/') ? routerUrl : `/${routerUrl}`;
  return `/${target}${path}`;
}
