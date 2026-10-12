import { inPageHref, isNewPage } from './current-url';

describe('inPageHref', () => {
  it('stays on the page it is on, relative to the locale base', () => {
    expect(inPageHref('/', 'main')).toBe('#main');
    expect(inPageHref('/work/apexflow', 'main')).toBe('work/apexflow#main');
    expect(inPageHref('/privacy?x=1#top', 'main')).toBe('privacy?x=1#main');
  });
});

describe('isNewPage', () => {
  it('is true for another path, false for a fragment or a query on the same one', () => {
    expect(isNewPage('/', '/work/apexflow')).toBe(true);
    expect(isNewPage('/work/apexflow', '/work/apexflow#outcome')).toBe(false);
    expect(isNewPage('/blog', '/blog?x=1')).toBe(false);
  });
});
