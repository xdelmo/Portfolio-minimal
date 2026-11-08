import { introFits } from './intro-state';

describe('intro timing', () => {
  it('lets the motion take over only when its timeline ends before the CSS fallback would', () => {
    expect(introFits(500, 2, 0, 3600)).toBe(true);
    expect(introFits(1600, 2, 0, 3600)).toBe(true);
    // late motion script: a 2s timeline from 2.5s would hold the page until 4.5s, past the 3.6s fallback
    expect(introFits(2500, 2, 0, 3600)).toBe(false);
    // phones lift by 2s (issue #381): a script 1.5s in is already too late there
    expect(introFits(500, 1.25, 0, 2000)).toBe(true);
    expect(introFits(1500, 1.25, 0, 2000)).toBe(false);
  });

  it('counts from when the CSS fallback really started, which a slow first render pushes back', () => {
    expect(introFits(2500, 2, 1000, 3600)).toBe(true);
  });
});
