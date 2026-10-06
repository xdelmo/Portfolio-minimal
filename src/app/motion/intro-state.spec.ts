import { INTRO_CSS_END_MS, introFits } from './intro-state';

describe('intro timing', () => {
  it('lets the motion take over only when its timeline ends before the CSS fallback would', () => {
    expect(introFits(500, 2)).toBe(true);
    expect(introFits(INTRO_CSS_END_MS - 2000, 2)).toBe(true);
    // late motion script: a 2s timeline from 2.5s would hold the page until 4.5s, past the 3.6s fallback
    expect(introFits(2500, 2)).toBe(false);
  });
});
