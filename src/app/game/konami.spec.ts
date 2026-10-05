import { KONAMI, konamiStep } from './konami';

const play = (keys: readonly string[]) => keys.reduce(konamiStep, 0);

describe('konamiStep', () => {
  it('unlocks after the whole code', () => {
    expect(play(KONAMI)).toBe(KONAMI.length);
  });

  it('starts over on a wrong key', () => {
    expect(play(['ArrowUp', 'ArrowUp', 'x'])).toBe(0);
  });

  it('still unlocks when the code starts after a repeated first key', () => {
    expect(play(['ArrowUp', ...KONAMI])).toBe(KONAMI.length);
  });

  it('a wrong key that is the first of the code counts as a new start', () => {
    expect(play(['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowUp'])).toBe(1);
  });

  it('takes B and A in either case', () => {
    expect(play([...KONAMI.slice(0, 8), 'B', 'A'])).toBe(KONAMI.length);
  });
});
