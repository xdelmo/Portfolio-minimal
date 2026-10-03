import { CONTENT_EN } from '../../content/content.en';
import { headLinks, pageUrl, personJsonLd } from './seo';

describe('pageUrl', () => {
  it('keeps the trailing slash on the home page only', () => {
    expect(pageUrl('/', 'en')).toBe('https://www.emanueledelmonte.it/en/');
    expect(pageUrl('/work/apexflow', 'it')).toBe('https://www.emanueledelmonte.it/it/work/apexflow');
    expect(pageUrl('/work/apexflow/', 'it')).toBe('https://www.emanueledelmonte.it/it/work/apexflow');
  });

  it('drops query and fragment', () => {
    expect(pageUrl('/work/apexflow?ref=x#top', 'en')).toBe('https://www.emanueledelmonte.it/en/work/apexflow');
  });
});

describe('headLinks', () => {
  it('returns canonical plus en, it and x-default alternates', () => {
    expect(headLinks('/work/apexflow', 'it')).toEqual([
      { rel: 'canonical', href: 'https://www.emanueledelmonte.it/it/work/apexflow' },
      { rel: 'alternate', hreflang: 'en', href: 'https://www.emanueledelmonte.it/en/work/apexflow' },
      { rel: 'alternate', hreflang: 'it', href: 'https://www.emanueledelmonte.it/it/work/apexflow' },
      { rel: 'alternate', hreflang: 'x-default', href: 'https://www.emanueledelmonte.it/en/work/apexflow' },
    ]);
  });
});

describe('personJsonLd', () => {
  it('describes the person with consistent identity links', () => {
    const ld = personJsonLd(CONTENT_EN.person, 'en');
    expect(ld['@type']).toBe('Person');
    expect(ld['name']).toBe('Emanuele Del Monte');
    expect(ld['url']).toBe('https://www.emanueledelmonte.it/en/');
    expect(ld['sameAs']).toEqual([CONTENT_EN.person.linkedin, CONTENT_EN.person.github]);
    expect(ld['alumniOf']).toEqual({ '@type': 'CollegeOrUniversity', name: 'Università Mercatorum' });
  });
});
