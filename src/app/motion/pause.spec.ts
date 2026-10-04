import { TestBed } from '@angular/core/testing';
import { MotionPause, watchPause } from './pause';

describe('MotionPause', () => {
  beforeEach(() => {
    sessionStorage.clear();
    document.documentElement.removeAttribute('data-motion-paused');
  });

  it('starts playing', () => {
    expect(TestBed.inject(MotionPause).paused()).toBe(false);
  });

  it('toggle pauses and the choice lasts for the session', () => {
    TestBed.inject(MotionPause).toggle();
    expect(sessionStorage.getItem('motion-paused')).toBe('1');
    TestBed.resetTestingModule();
    expect(TestBed.inject(MotionPause).paused()).toBe(true);
  });

  it('toggle still works when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('denied', 'QuotaExceededError');
    });
    const pause = TestBed.inject(MotionPause);
    pause.toggle();
    expect(pause.paused()).toBe(true);
    vi.restoreAllMocks();
  });

  it('tells code outside Angular through <html> and watchPause', () => {
    const pause = TestBed.inject(MotionPause);
    const seen: boolean[] = [];
    const stop = watchPause((paused) => seen.push(paused));
    pause.toggle();
    expect(document.documentElement.hasAttribute('data-motion-paused')).toBe(true);
    pause.toggle();
    stop();
    pause.toggle();
    expect(seen).toEqual([false, true, false]);
  });
});
