import { InjectionToken, LOCALE_ID, inject } from '@angular/core';
import { toLocale } from '../core/i18n/locale';
import { BLOG as ARTICLES } from './blog.generated';
import { Article } from './content.model';

/** The blog in the page's language, newest first. */
export const BLOG = new InjectionToken<readonly Article[]>('BLOG', {
  providedIn: 'root',
  factory: () => ARTICLES[toLocale(inject(LOCALE_ID))],
});
