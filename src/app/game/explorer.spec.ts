import { EXPLORED_KEY, parseExplored, readExplored, recordVisit } from './explorer';

const ALL = ['a', 'b', 'c'];

describe('explorer', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('keeps only slugs that are still case studies, in their order', () => {
    expect(parseExplored('["c","gone","a"]', ALL)).toEqual(['a', 'c']);
    expect(parseExplored(null, ALL)).toEqual([]);
    expect(parseExplored('not json', ALL)).toEqual([]);
    expect(parseExplored('{"a":1}', ALL)).toEqual([]);
  });

  it('unlocks on the visit that completes the set, once', () => {
    expect(recordVisit('a', ALL)).toBe(false);
    expect(recordVisit('a', ALL)).toBe(false);
    expect(recordVisit('b', ALL)).toBe(false);
    expect(recordVisit('nope', ALL)).toBe(false);
    expect(recordVisit('c', ALL)).toBe(true);
    expect(recordVisit('c', ALL)).toBe(false);
    expect(readExplored(ALL)).toEqual(ALL);
    expect(localStorage.getItem(EXPLORED_KEY)).toBe('["a","b","c"]');
  });
});
