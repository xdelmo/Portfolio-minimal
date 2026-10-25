/** Local storage entry with the case studies already read, for the Explorer achievement (issue #133). */
export const EXPLORED_KEY = 'explored';

/** The slugs in `stored` that are still case studies: a removed project or a hand-edited entry counts for nothing. */
export function parseExplored(stored: string | null, all: readonly string[]): string[] {
  try {
    const value: unknown = JSON.parse(stored ?? '[]');
    return Array.isArray(value) ? all.filter((slug) => value.includes(slug)) : [];
  } catch {
    return [];
  }
}

function storage(): Storage | undefined {
  try {
    return localStorage;
  } catch {
    return undefined;
  }
}

/** The case studies read in this browser; none when storage is blocked. */
export function readExplored(all: readonly string[]): string[] {
  return parseExplored(storage()?.getItem(EXPLORED_KEY) ?? null, all);
}

/** Remembers that `slug` was read; true only for the visit that completes the set. */
export function recordVisit(slug: string, all: readonly string[]): boolean {
  const before = readExplored(all);
  if (!all.includes(slug) || before.includes(slug)) return false;
  const after = parseExplored(JSON.stringify([...before, slug]), all);
  try {
    storage()?.setItem(EXPLORED_KEY, JSON.stringify(after));
  } catch {
    return false; // storage blocked or full: nothing remembered, nothing unlocked
  }
  return after.length === all.length;
}
