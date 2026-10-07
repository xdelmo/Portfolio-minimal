/** Fired on the document as the easter egg opens. Whoever plays a lead-in to it (the hero's level up) calls preventDefault(). */
export const GAME_START = 'game:start';

/** How long the card waits for a lead-in. */
export const LEAD_IN_MS = 500;

/** Announces the game; true when something on the page is playing a lead-in the card should wait for. */
export function announceGameStart(): boolean {
  return !document.dispatchEvent(new Event(GAME_START, { cancelable: true }));
}
