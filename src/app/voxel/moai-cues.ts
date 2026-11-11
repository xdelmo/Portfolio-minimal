import { Injectable } from '@angular/core';
import type { Reaction } from './voice';

/** Where the moai follows the pointer and speaks: desktop with a mouse (moai-scene.ts, moai-guest.ts). */
export const MOAI_DESKTOP = '(min-width: 1024px) and (pointer: fine)';

/**
 * What the rest of the site tells the moai (issue #393): the copy button, the theme, the game, a case study read. Kept
 * tiny and out of the moai's lazy chunk; a cue no moai says is dropped, unless it is kept for the next one to arrive.
 */
@Injectable({ providedIn: 'root' })
export class MoaiCues {
  private readonly listeners = new Set<(reaction: Reaction) => boolean>();
  private pending: Reaction | null = null;

  /** Whether a moai said its line; with `keep`, a line no moai said waits for the next one to come on screen. */
  cue(reaction: Reaction, keep = false): boolean {
    let said = false;
    for (const listener of this.listeners) said = listener(reaction) || said;
    if (!said && keep) this.pending = reaction;
    return said;
  }

  /** The kept cue, once. */
  take(): Reaction | null {
    const reaction = this.pending;
    this.pending = null;
    return reaction;
  }

  /** `listener` answers whether it spoke. */
  listen(listener: (reaction: Reaction) => boolean): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

/** Set by the language switch: the moai on the page it opens says hello once. */
export const HELLO_KEY = 'moai-hello';
