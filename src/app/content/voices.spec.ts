import { describe, expect, it } from 'vitest';
import { CONTENT_EN } from './content.en';
import { CONTENT_IT } from './content.it';
import { around, voices } from './voices';

describe('around', () => {
  it('splits a sentence around the last occurrence of a word', () => {
    expect(around('look well, look well.', 'well')).toEqual(['look well, look ', 'well', '.']);
  });

  it('throws when the word is missing', () => {
    expect(() => around('look closely.', 'well')).toThrow('word must be in the sentence');
  });

  it.each([
    ['en', CONTENT_EN],
    ['it', CONTENT_IT],
  ])('the %s lede holds its peek word', (_name, c) => {
    expect(around(c.hero.lede, c.hero.peek).join('')).toBe(c.hero.lede);
  });
});

describe('voices', () => {
  it('splits a sentence into its method and its voice', () => {
    expect(voices('Engineer by method, curious by nature.', 'curious by nature.')).toEqual([
      'Engineer by method,',
      'curious by nature.',
    ]);
  });

  it('throws when the voice does not end the sentence', () => {
    expect(() => voices('Engineer by method, curious by nature.', 'by method')).toThrow('voice must end the sentence');
  });

  it.each([
    ['en', CONTENT_EN],
    ['it', CONTENT_IT],
  ])('the %s content splits', (_name, c) => {
    expect(() => voices(c.hero.headline, c.hero.voice)).not.toThrow();
    expect(() => voices(c.aboutStatement, c.aboutVoice)).not.toThrow();
  });
});
