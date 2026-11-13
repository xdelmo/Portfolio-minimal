/**
 * "Quiet route": an original 8-bit ambient for the background (issue #516), as calm and airy as the page and its
 * clouds (DESIGN.md, "The Quiet Arcade"). No tune to follow while reading: slow seventh-chord pads in D major, a faint
 * bass, and sparse bell notes picked at random from the D major pentatonic (consonant over every chord), so the loop
 * never sounds the same twice. One step is an eighth note at 60 bpm; every chord lasts two bars (8 s).
 */
export const BPM = 60;
export const STEPS_PER_BEAT = 2;

export type Voice = 'bass' | 'pad';

export interface NoteEvent {
  step: number;
  voice: Voice;
  /** MIDI number */
  midi: number;
  /** in steps */
  length: number;
}

const CHORDS = 'Dmaj7 Gmaj7 Bm7 Aadd9 Dmaj7 Gmaj7 Em7 Aadd9';
const CHORD_STEPS = 16;

/** chord tones from the root, up to the ninth */
const QUALITY: Record<string, number[]> = {
  maj7: [0, 4, 7, 11, 14],
  m7: [0, 3, 7, 10, 14],
  add9: [0, 4, 7, 12, 14],
};

const SEMITONE: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** "F#5" → 78 */
export function midi(name: string): number {
  const m = /^([A-G])(#?)(\d)$/.exec(name);
  if (!m) throw new Error(`bad note ${name}`);
  return 12 * (Number(m[3]) + 1) + (SEMITONE[m[1]] ?? 0) + (m[2] ? 1 : 0);
}

/** Per chord: a faint bass on the root and a pad holding the colour tones (third, seventh, ninth). */
function chord(name: string, at: number): NoteEvent[] {
  const m = /^([A-G]#?)(maj7|m7|add9)$/.exec(name);
  if (!m) throw new Error(`bad chord ${name}`);
  const [, root = 'C', quality = 'maj7'] = m;
  const tones = QUALITY[quality] ?? [];
  const pad = midi(`${root}3`);
  return [
    { step: at, voice: 'bass', midi: midi(`${root}2`), length: CHORD_STEPS },
    ...[1, 3, 4].map((i): NoteEvent => ({ step: at, voice: 'pad', midi: pad + (tones[i] ?? 0), length: CHORD_STEPS })),
  ];
}

/** The chord loop: 8 chords, 64 s. */
export const SONG: { length: number; events: NoteEvent[] } = {
  length: CHORDS.split(' ').length * CHORD_STEPS,
  events: CHORDS.split(' ').flatMap((name, i) => chord(name, i * CHORD_STEPS)),
};

/** The bells' notes: D major pentatonic, high up. */
export const BELLS = ['D5', 'E5', 'F#5', 'A5', 'B5', 'D6', 'E6'].map(midi);
/** chance of a bell on each step: about one every four seconds */
export const DENSITY = 0.12;
const MOVES = [-2, -1, 1, 2];

/**
 * Maybe a bell on this step: the index into BELLS of the next note, a small step away from the previous one (never
 * the same note twice, so it drifts instead of repeating), or undefined for silence.
 */
export function bell(previous: number, random: () => number): number | undefined {
  if (random() >= DENSITY) return undefined;
  const move = MOVES[Math.floor(random() * MOVES.length)] ?? 1;
  const next = previous + move;
  return next >= 0 && next < BELLS.length ? next : previous - move;
}
