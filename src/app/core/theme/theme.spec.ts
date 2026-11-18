import { readStoredTheme, resolveTheme, storedAfterToggle } from './theme.service';

describe('resolveTheme', () => {
  it('uses a valid stored choice over the system preference', () => {
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });

  it('falls back to the system preference when nothing valid is stored', () => {
    expect(resolveTheme(null, true)).toBe('dark');
    expect(resolveTheme(null, false)).toBe('light');
    expect(resolveTheme('purple', true)).toBe('dark');
  });
});

describe('readStoredTheme', () => {
  it('reads the stored value', () => {
    expect(readStoredTheme({ getItem: () => 'dark' })).toBe('dark');
  });

  it('returns null when storage is missing', () => {
    expect(readStoredTheme(undefined)).toBeNull();
  });

  it('returns null instead of throwing when storage is blocked', () => {
    const blocked = {
      getItem: () => {
        throw new DOMException('denied', 'SecurityError');
      },
    };
    expect(readStoredTheme(blocked)).toBeNull();
  });
});

describe('storedAfterToggle', () => {
  it('stores a theme that differs from the system', () => {
    expect(storedAfterToggle('dark', false)).toBe('dark');
    expect(storedAfterToggle('light', true)).toBe('light');
  });

  it('stores nothing when the theme is back to the system one', () => {
    expect(storedAfterToggle('light', false)).toBeNull();
    expect(storedAfterToggle('dark', true)).toBeNull();
  });
});
