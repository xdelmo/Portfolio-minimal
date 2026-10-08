import { inPageHref } from './current-url';

describe('inPageHref', () => {
  it('stays on the page it is on, relative to the locale base', () => {
    expect(inPageHref('/', 'main')).toBe('#main');
    expect(inPageHref('/work/apexflow', 'main')).toBe('work/apexflow#main');
    expect(inPageHref('/privacy?x=1#top', 'main')).toBe('privacy?x=1#main');
  });
});
