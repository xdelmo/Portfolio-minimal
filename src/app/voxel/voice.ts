/** What the moai has a line for (issue #393). */
export type Reaction =
  | 'copy'
  | 'hop'
  | 'gum'
  | 'drag'
  | 'dizzy'
  | 'shake'
  | 'sulk'
  | 'sneeze'
  | 'dark'
  | 'light'
  | 'hello'
  | 'found'
  | 'explorer'
  | 'wake';

/** At most one line this often, in milliseconds: a line that comes sooner is dropped, never queued. */
export const COOLDOWN_MS = 10_000;
/** How long a line stays up. */
export const LINE_MS = 3000;
/** Rare lines the visitor asked for: they always pass and replace the open one. */
export const ALWAYS: ReadonlySet<Reaction> = new Set<Reaction>(['copy', 'found']);

export interface VoiceState {
  readonly lastAt: number | null;
  /** The variant each reaction said last, so it never says the same one twice in a row. */
  readonly last: Partial<Record<Reaction, number>>;
}

export const QUIET: VoiceState = { lastAt: null, last: {} };

/** Which of its `variants` lines the moai says for `reaction` at `now`, or null when it keeps quiet. */
export function speak(state: VoiceState, reaction: Reaction, variants: number, now: number, random: () => number): { variant: number; state: VoiceState } | null {
  if (!ALWAYS.has(reaction) && state.lastAt !== null && now - state.lastAt < COOLDOWN_MS) return null;
  const previous = state.last[reaction];
  const choices = Array.from({ length: variants }, (_, i) => i).filter((i) => variants === 1 || i !== previous);
  const variant = choices[Math.min(choices.length - 1, Math.floor(random() * choices.length))];
  return { variant, state: { lastAt: now, last: { ...state.last, [reaction]: variant } } };
}
