import { Injectable } from '@angular/core';
import type { Reaction } from './voice';

/** Where the moai follows the pointer and speaks: desktop with a mouse (moai-scene.ts, moai-guest.ts). */
export const MOAI_DESKTOP = '(min-width: 1024px) and (pointer: fine)';

/**
 * What the rest of the site tells the moai (issue #393): the copy button, later the theme, the language and the game. Kept
 * tiny and out of the moai's lazy chunk; a cue with no scene listening is dropped, never queued.
 */
@Injectable({ providedIn: 'root' })
export class MoaiCues {
  private readonly listeners = new Set<(reaction: Reaction) => boolean>();

  /** Whether a moai said its line. */
  cue(reaction: Reaction): boolean {
    let said = false;
    for (const listener of this.listeners) said = listener(reaction) || said;
    return said;
  }

  /** `listener` answers whether it spoke. */
  listen(listener: (reaction: Reaction) => boolean): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}
