import { Person, Project } from '../../content/content.model';
import { Locale } from '../i18n/locale';

export const SITE_URL = 'https://www.emanueledelmonte.it';

export interface HeadLink {
  rel: 'canonical' | 'alternate';
  href: string;
  hreflang?: 'en' | 'it' | 'x-default';
}

const cleanPath = (path: string): string => path.split(/[?#]/)[0].replace(/\/+$/, '');

export function pageUrl(path: string, locale: Locale): string {
  const clean = cleanPath(path);
  return `${SITE_URL}/${locale}${clean === '' ? '/' : clean}`;
}

/** The page's Markdown version, written by scripts/geo-files.mjs. */
export function markdownPath(path: string, locale: Locale): string {
  const clean = cleanPath(path);
  return `/${locale}${clean === '' ? '/index' : clean}.md`;
}

export function headLinks(path: string, locale: Locale): HeadLink[] {
  return [
    { rel: 'canonical', href: pageUrl(path, locale) },
    { rel: 'alternate', hreflang: 'en', href: pageUrl(path, 'en') },
    { rel: 'alternate', hreflang: 'it', href: pageUrl(path, 'it') },
    { rel: 'alternate', hreflang: 'x-default', href: pageUrl(path, 'en') },
  ];
}

export const PERSON_ID = `${SITE_URL}/#person`;

function personNode(person: Person, locale: Locale): Record<string, unknown> {
  return {
    '@type': 'Person',
    '@id': PERSON_ID,
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

export function homeJsonLd(person: Person, locale: Locale): Record<string, unknown> {
  const url = pageUrl('/', locale);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebSite', '@id': `${SITE_URL}/#website`, url: `${SITE_URL}/`, name: person.name, publisher: { '@id': PERSON_ID }, inLanguage: ['en', 'it'] },
      { '@type': 'ProfilePage', '@id': `${url}#page`, url, name: `${person.name} — ${person.role}`, inLanguage: locale, mainEntity: { '@id': PERSON_ID } },
      personNode(person, locale),
    ],
  };
}

export function caseStudyJsonLd(project: Project, person: Person, locale: Locale): Record<string, unknown> {
  const url = pageUrl(`/work/${project.slug}`, locale);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: person.name, item: pageUrl('/', locale) },
          { '@type': 'ListItem', position: 2, name: project.title, item: url },
        ],
      },
      {
        '@type': 'SoftwareSourceCode',
        '@id': `${url}#code`,
        url,
        name: project.title,
        description: project.summary,
        codeRepository: project.repos[0].url,
        programmingLanguage: project.stack,
        inLanguage: locale,
        author: { '@id': PERSON_ID },
      },
      personNode(person, locale),
    ],
  };
}
