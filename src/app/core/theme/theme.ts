export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'theme';

export function resolveTheme(stored: string | null, prefersDark: boolean): Theme {
  if (stored === 'light' || stored === 'dark') return stored;
  return prefersDark ? 'dark' : 'light';
}

export function readStoredTheme(storage: Pick<Storage, 'getItem'> | undefined): string | null {
  try {
    return storage?.getItem(THEME_STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
}
