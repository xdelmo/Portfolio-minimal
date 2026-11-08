import { REVEAL_PX, headerHidden } from './header-reveal';

describe('headerHidden', () => {
  it('always shows the header at the top of the page', () => {
    expect(headerHidden(true, 40, 10, 64)).toBe(false);
  });

  it('hides it while the page scrolls down', () => {
    expect(headerHidden(false, 500, 2, 64)).toBe(true);
  });

  it('brings it back when the page scrolls up, but not on a wobble', () => {
    expect(headerHidden(true, 500, -REVEAL_PX, 64)).toBe(false);
    expect(headerHidden(true, 500, -2, 64)).toBe(true);
    expect(headerHidden(false, 500, -2, 64)).toBe(false);
  });
});
