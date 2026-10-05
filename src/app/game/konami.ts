/** ↑ ↑ ↓ ↓ ← → ← → B A, as KeyboardEvent.key values. */
export const KONAMI: readonly string[] = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

/**
 * How much of the code has been typed after `key`, given how much had been typed before: the longest tail of the keys so
 * far that begins the code, so a stray key never costs the keys that can still start it (↑ ↑ ↑ ↓ … still unlocks).
 * The code is unlocked when the result is `KONAMI.length`.
 */
export function konamiStep(progress: number, key: string): number {
  const keys = [...KONAMI.slice(0, progress), key.length === 1 ? key.toLowerCase() : key];
  for (let start = 0; start < keys.length; start++) {
    const tail = keys.slice(start);
    if (tail.every((k, i) => k === KONAMI[i])) return tail.length;
  }
  return 0;
}
