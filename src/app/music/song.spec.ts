import { describe, expect, it } from 'vitest';
import { midi, parsePart, SONG } from './song';

describe('song', () => {
  it('reads note names as MIDI numbers', () => {
    expect(midi('A4')).toBe(69);
    expect(midi('F#5')).toBe(78);
    expect(() => midi('H2')).toThrow();
  });

  it('holds notes on "-" and skips rests', () => {
    expect(parsePart('D5 - . B4', 'lead', 8)).toEqual([
      { step: 8, voice: 'lead', midi: 74, length: 2 },
      { step: 11, voice: 'lead', midi: 71, length: 1 },
    ]);
  });

  it('loops 24 bars with every note inside the loop', () => {
    expect(SONG.length).toBe(192);
    for (const event of SONG.events) {
      expect(event.step).toBeGreaterThanOrEqual(0);
      expect(event.step + event.length).toBeLessThanOrEqual(SONG.length);
    }
    expect(SONG.events.filter((e) => e.voice === 'lead').length).toBeGreaterThan(30);
  });
});
