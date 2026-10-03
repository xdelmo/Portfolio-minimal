import { Person } from '../../content/content.model';
import { Locale } from '../i18n/locale';

export const SITE_URL = 'https://www.emanueledelmonte.it';

export interface HeadLink {
  rel: 'canonical' | 'alternate';
  href: string;
  hreflang?: 'en' | 'it' | 'x-default';
}

export function pageUrl(path: string, locale: Locale): string {
  const clean = path.split(/[?#]/)[0].replace(/\/+$/, '');
  return `${SITE_URL}/${locale}${clean === '' ? '/' : clean}`;
}

export function headLinks(path: string, locale: Locale): HeadLink[] {
  return [
    { rel: 'canonical', href: pageUrl(path, locale) },
    { rel: 'alternate', hreflang: 'en', href: pageUrl(path, 'en') },
    { rel: 'alternate', hreflang: 'it', href: pageUrl(path, 'it') },
    { rel: 'alternate', hreflang: 'x-default', href: pageUrl(path, 'en') },
  ];
}

export function personJsonLd(person: Person, locale: Locale): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: person.name,
    url: pageUrl('/', locale),
    jobTitle: person.role,
    worksFor: { '@type': 'Organization', name: person.employer },
    alumniOf: { '@type': 'CollegeOrUniversity', name: 'Università Mercatorum' },
    address: { '@type': 'PostalAddress', addressLocality: 'Latina', addressCountry: 'IT' },
    email: `mailto:${person.email}`,
    sameAs: [person.linkedin, person.github],
    knowsAbout: person.knowsAbout,
  };
}
