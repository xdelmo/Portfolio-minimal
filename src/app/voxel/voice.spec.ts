import { describe, expect, it } from 'vitest';
import { COOLDOWN_MS, QUIET, Reaction, VoiceState, speak } from './voice';

const first = () => 0;

/** A line the moai must say. */
function said(state: VoiceState, reaction: Reaction, variants: number, now: number, random = first) {
  const line = speak(state, reaction, variants, now, random);
  if (!line) throw new Error(`${reaction} kept quiet at ${String(now)}`);
  return line;
}

describe('speak', () => {
  it('says the first line, then drops any other within the cooldown', () => {
    const a = said(QUIET, 'hop', 2, 1000);
    expect(a.variant).toBe(0);
    expect(speak(a.state, 'gum', 1, 1000 + COOLDOWN_MS - 1, first)).toBeNull();
    expect(speak(a.state, 'gum', 1, 1000 + COOLDOWN_MS, first)?.variant).toBe(0);
  });

  it('lets the copy and found lines through at once, and counts the cooldown from them', () => {
    const a = said(QUIET, 'hop', 2, 0, first);
    const copy = said(a.state, 'copy', 1, 1);
    expect(speak(copy.state, 'found', 1, 2, first)).not.toBeNull();
    expect(speak(copy.state, 'hop', 2, COOLDOWN_MS, first)).toBeNull();
    expect(speak(copy.state, 'hop', 2, COOLDOWN_MS + 1, first)).not.toBeNull();
  });

  it('never says the same variant twice in a row', () => {
    const a = said(QUIET, 'hop', 2, 0, first);
    const b = said(a.state, 'hop', 2, COOLDOWN_MS, first);
    const c = said(b.state, 'hop', 2, 2 * COOLDOWN_MS, first);
    expect([a.variant, b.variant, c.variant]).toEqual([0, 1, 0]);
    const d = said(c.state, 'hop', 3, 3 * COOLDOWN_MS, () => 0.999);
    expect(d.variant).toBe(2);
  });

  it('repeats a reaction with a single line', () => {
    const a = said(QUIET, 'gum', 1, 0, first);
    expect(speak(a.state, 'gum', 1, COOLDOWN_MS, () => 0.999)?.variant).toBe(0);
  });
});
