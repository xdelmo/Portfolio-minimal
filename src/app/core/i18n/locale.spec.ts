import { localizedUrl, toLocale } from './locale';

describe('toLocale', () => {
  it('maps Italian locale ids to it', () => {
    expect(toLocale('it')).toBe('it');
    expect(toLocale('it-IT')).toBe('it');
  });

  it('maps everything else to en', () => {
    expect(toLocale('en')).toBe('en');
    expect(toLocale('en-US')).toBe('en');
    expect(toLocale('de')).toBe('en');
  });
});

describe('localizedUrl', () => {
  it('maps the home page', () => {
    expect(localizedUrl('/', 'it')).toBe('/it/');
  });

  it('maps a nested page', () => {
    expect(localizedUrl('/work/apexflow', 'en')).toBe('/en/work/apexflow');
  });

  it('keeps fragments and query strings', () => {
    expect(localizedUrl('/#work', 'it')).toBe('/it/#work');
    expect(localizedUrl('/work/apexflow?ref=linkedin', 'it')).toBe('/it/work/apexflow?ref=linkedin');
  });

  it('accepts a url without the leading slash', () => {
    expect(localizedUrl('work/apexflow', 'it')).toBe('/it/work/apexflow');
  });
});
