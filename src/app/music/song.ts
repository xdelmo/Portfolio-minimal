/**
 * "Quiet route": an original, slow chiptune loop (issue #516) in D major at 72 bpm, as calm as the page around it
 * (DESIGN.md, "The Quiet Arcade"): one seventh chord per bar, a sparse lead, an echoing arpeggio, no drums.
 * One step is an eighth note; a bar is 8 steps. In a part, "-" holds the previous note and "." is a rest.
 */
export const BPM = 72;
export const STEPS_PER_BEAT = 2;

export type Voice = 'lead' | 'arp' | 'bass' | 'tick';

export interface NoteEvent {
  step: number;
  voice: Voice;
  /** MIDI number; 0 for the tick */
  midi: number;
  /** in steps */
  length: number;
}

const A_LEAD = [
  'A4 - - - F#5 - - -',
  'E5 - - C#5 - - A4 -',
  'D5 - - - - - . .',
  'B4 - D5 - F#5 - - -',
  'A5 - - - F#5 - E5 -',
  'C#5 - - - E5 - - -',
  'D5 - B4 - G4 - - -',
  'A4 - - - - - . .',
];
const B_LEAD = [
  'B5 - - - A5 - F#5 -',
  'A5 - - - - - E5 -',
  'G5 - F#5 - E5 - B4 -',
  'C#5 - - - D5 - - -',
  'B4 - D5 - G5 - - -',
  'F#5 - E5 - C#5 - - -',
  'E5 - - - D5 - B4 -',
  'E5 - - - C#5 - . .',
];
/** one chord per bar */
const A_CHORDS = 'Dmaj7 F#m7 Bm7 Gmaj7 Dmaj7 F#m7 Em7 Aadd9';
const B_CHORDS = 'Gmaj7 F#m7 Em7 Dmaj7 Gmaj7 F#m7 Em7 Aadd9';

/** chord tones from the root, up to the ninth */
const QUALITY: Record<string, number[]> = {
  maj7: [0, 4, 7, 11, 14],
  m7: [0, 3, 7, 10, 14],
  add9: [0, 4, 7, 12, 14],
};
/** the arpeggio climbs the chord and comes back down, a note per step */
const ARP = [0, 1, 2, 3, 4, 3, 2, 1];

const SEMITONE: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** "F#5" → 78 */
export function midi(name: string): number {
  const m = /^([A-G])(#?)(\d)$/.exec(name);
  if (!m) throw new Error(`bad note ${name}`);
  return 12 * (Number(m[3]) + 1) + (SEMITONE[m[1]] ?? 0) + (m[2] ? 1 : 0);
}

/** A part ("D5 - B4 .") → note events starting at `offset`. */
export function parsePart(part: string, voice: Voice, offset = 0): NoteEvent[] {
  const events: NoteEvent[] = [];
  part.split(/\s+/).forEach((token, i) => {
    const last = events.at(-1);
    if (token === '-') {
      if (last && last.step + last.length === offset + i) last.length++;
    } else if (token !== '.') {
      events.push({ step: offset + i, voice, midi: midi(token), length: 1 });
    }
  });
  return events;
}

/** Per bar: bass on the root then the fifth, the arpeggio over the chord, a soft tick on beats 2 and 4. */
function accompaniment(chords: string, offset: number): NoteEvent[] {
  return chords.split(' ').flatMap((name, bar): NoteEvent[] => {
    const m = /^([A-G]#?)(maj7|m7|add9)$/.exec(name);
    if (!m) throw new Error(`bad chord ${name}`);
    const [, root = 'C', quality = 'maj7'] = m;
    const tones = QUALITY[quality] ?? [];
    const at = offset + bar * 8;
    const bass = midi(`${root}2`);
    const arp = midi(`${root}4`);
    return [
      { step: at, voice: 'bass', midi: bass, length: 4 },
      { step: at + 4, voice: 'bass', midi: bass + 7, length: 4 },
      ...ARP.map((i, s): NoteEvent => ({ step: at + s, voice: 'arp', midi: arp + (tones[i] ?? 0), length: 1 })),
      { step: at + 2, voice: 'tick', midi: 0, length: 1 },
      { step: at + 6, voice: 'tick', midi: 0, length: 1 },
    ];
  });
}

function section(lead: string[] | null, chords: string, offset: number): NoteEvent[] {
  return [...(lead ? parsePart(lead.join(' '), 'lead', offset) : []), ...accompaniment(chords, offset)];
}

/** The whole loop: A, B, then A's chords alone to breathe; 24 bars (80 s). */
export const SONG: { length: number; events: NoteEvent[] } = {
  length: 24 * 8,
  events: [...section(A_LEAD, A_CHORDS, 0), ...section(B_LEAD, B_CHORDS, 64), ...section(null, A_CHORDS, 128)],
};
