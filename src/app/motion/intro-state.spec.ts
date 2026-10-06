import { INTRO_CSS_MS, introFits } from './intro-state';

describe('intro timing', () => {
  it('lets the motion take over only when its timeline ends before the CSS fallback would', () => {
    expect(introFits(500, 2, 0)).toBe(true);
    expect(introFits(INTRO_CSS_MS - 2000, 2, 0)).toBe(true);
    // late motion script: a 2s timeline from 2.5s would hold the page until 4.5s, past the 3.6s fallback
    expect(introFits(2500, 2, 0)).toBe(false);
  });

  it('counts from when the CSS fallback really started, which a slow first render pushes back', () => {
    expect(introFits(2500, 2, 1000)).toBe(true);
  });
});
