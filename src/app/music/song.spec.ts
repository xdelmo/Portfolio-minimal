import { describe, expect, it } from 'vitest';
import { bell, BELLS, DENSITY, midi, SONG } from './song';

describe('song', () => {
  it('reads note names as MIDI numbers', () => {
    expect(midi('A4')).toBe(69);
    expect(midi('F#5')).toBe(78);
    expect(() => midi('H2')).toThrow();
  });

  it('loops 8 chords with every note inside the loop', () => {
    expect(SONG.length).toBe(128);
    for (const event of SONG.events) {
      expect(event.step).toBeGreaterThanOrEqual(0);
      expect(event.step + event.length).toBeLessThanOrEqual(SONG.length);
    }
  });

  it('rings a bell only below the density, a step away from the last and inside the scale', () => {
    expect(bell(3, () => DENSITY)).toBeUndefined();
    const rolls = [0, 0.99];
    expect(bell(0, () => rolls.shift() ?? 0)).toBe(2);
    expect(bell(BELLS.length - 1, () => 0)).toBe(BELLS.length - 3);
    for (let i = 0; i < 200; i++) {
      const next = bell(i % BELLS.length, () => Math.random() * DENSITY);
      expect(next).toBeGreaterThanOrEqual(0);
      expect(next).toBeLessThan(BELLS.length);
      expect(next).not.toBe(i % BELLS.length);
    }
  });
});
