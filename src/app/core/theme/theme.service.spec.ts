import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset['theme'];
  });

  afterEach(() => vi.restoreAllMocks());

  it('starts from the stored choice', () => {
    localStorage.setItem('theme', 'dark');
    const service = TestBed.inject(ThemeService);
    expect(service.theme()).toBe('dark');
  });

  it('toggle flips the theme, updates <html> and stores the choice', () => {
    const service = TestBed.inject(ThemeService);
    const before = service.theme();
    service.toggle();
    const after = before === 'dark' ? 'light' : 'dark';
    expect(service.theme()).toBe(after);
    expect(document.documentElement.dataset['theme']).toBe(after);
    expect(localStorage.getItem('theme')).toBe(after);
  });

  it('toggle still works when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('denied', 'QuotaExceededError');
    });
    const service = TestBed.inject(ThemeService);
    const before = service.theme();
    expect(() => service.toggle()).not.toThrow();
    expect(service.theme()).not.toBe(before);
  });
});
