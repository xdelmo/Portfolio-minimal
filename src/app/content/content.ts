import { InjectionToken, LOCALE_ID, inject } from '@angular/core';
import { toLocale } from '../core/i18n/locale';
import { CONTENT_EN } from './content.en';
import { CONTENT_IT } from './content.it';
import { SiteContent } from './content.model';
import { PUBLIC_REPOS } from './public-repos.generated';
import { onlyPublic } from './public-repos';

export const CONTENT = new InjectionToken<SiteContent>('CONTENT', {
  providedIn: 'root',
  factory: () => onlyPublic(toLocale(inject(LOCALE_ID)) === 'it' ? CONTENT_IT : CONTENT_EN, (url) => PUBLIC_REPOS.includes(url)),
});
