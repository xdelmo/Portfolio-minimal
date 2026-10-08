import { CONTENT_EN } from '../../content/content.en';
import { CONTENT_IT } from '../../content/content.it';
import { PERSON_ID, caseStudyJsonLd, caseStudyTitle, headLinks, homeJsonLd, markdownPath, ogImageUrl, pageUrl } from './seo';

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

describe('markdownPath', () => {
  it('maps pages to their Markdown twin', () => {
    expect(markdownPath('/', 'en')).toBe('/en/index.md');
    expect(markdownPath('/work/apexflow', 'it')).toBe('/it/work/apexflow.md');
    expect(markdownPath('/work/apexflow/?x=1', 'it')).toBe('/it/work/apexflow.md');
  });
});

describe('ogImageUrl', () => {
  it('points at the per-locale image inside the locale build', () => {
    expect(ogImageUrl('home', 'it')).toBe('https://www.emanueledelmonte.it/it/og/it-home.png');
  });
});

type Node = Record<string, unknown>;
const nodeOf = (ld: Node, type: string): Node => (ld['@graph'] as Node[]).find((n) => n['@type'] === type) ?? {};

describe('homeJsonLd', () => {
  const ld = homeJsonLd(CONTENT_EN.person, 'en');

  it('links WebSite, ProfilePage and Person through one person id', () => {
    expect((ld['@graph'] as Node[]).map((n) => n['@type'])).toEqual(['WebSite', 'ProfilePage', 'Person']);
    expect(nodeOf(ld, 'Person')['@id']).toBe(PERSON_ID);
    expect(nodeOf(ld, 'ProfilePage')['mainEntity']).toEqual({ '@id': PERSON_ID });
    expect(nodeOf(ld, 'WebSite')['publisher']).toEqual({ '@id': PERSON_ID });
  });

  it('describes the person with consistent identity links', () => {
    const person = nodeOf(ld, 'Person');
    expect(person['name']).toBe('Emanuele Del Monte');
    expect(person['sameAs']).toEqual([CONTENT_EN.person.linkedin, CONTENT_EN.person.github]);
    expect(person['image']).toBe('https://www.emanueledelmonte.it/en/images/emanuele.jpg');
    expect(person['address']).toEqual({ '@type': 'PostalAddress', addressLocality: 'Latina', addressCountry: 'IT' });
    expect(person['alumniOf']).toEqual({ '@type': 'CollegeOrUniversity', name: 'Università Mercatorum' });
    expect(nodeOf(ld, 'ProfilePage')['url']).toBe('https://www.emanueledelmonte.it/en/');
    expect(nodeOf(ld, 'ProfilePage')['inLanguage']).toBe('en');
  });

  it('gives agents one quotable sentence about the person and the languages spoken', () => {
    const person = nodeOf(ld, 'Person');
    expect(person['description']).toBe(CONTENT_EN.person.summary);
    expect(person['description']).toMatch(/Angular/);
    expect(person['knowsLanguage']).toEqual(['it', 'en']);
  });
});

describe('caseStudyTitle', () => {
  it('says what the project is built with, not only its name', () => {
    const project = CONTENT_EN.projects[0];
    expect(caseStudyTitle(project, CONTENT_EN.person)).toBe('ApexFlow: Angular, Signals, RxJS — Emanuele Del Monte');
  });
});

describe('caseStudyJsonLd', () => {
  const project = CONTENT_IT.projects[0];
  const ld = caseStudyJsonLd(project, CONTENT_IT.person, 'it');

  it('has a two-step breadcrumb from the localized home', () => {
    expect(nodeOf(ld, 'BreadcrumbList')['itemListElement']).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Emanuele Del Monte', item: 'https://www.emanueledelmonte.it/it/' },
      { '@type': 'ListItem', position: 2, name: project.title, item: `https://www.emanueledelmonte.it/it/work/${project.slug}` },
    ]);
  });

  it('describes the code with its repository and the author', () => {
    const code = nodeOf(ld, 'SoftwareSourceCode');
    expect(code['name']).toBe(project.title);
    expect(code['codeRepository']).toBe(project.repos[0].url);
    expect(code['author']).toEqual({ '@id': PERSON_ID });
    expect(code['inLanguage']).toBe('it');
    expect(nodeOf(ld, 'Person')['@id']).toBe(PERSON_ID);
  });
});
