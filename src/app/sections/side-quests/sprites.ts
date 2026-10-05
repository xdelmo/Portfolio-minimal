import { dissolveThresholds, type DissolvePath } from '../../pixel-dissolve/dissolve';

/** A 16 × 16 pixel drawing: one character per cell, `.` for empty, every other one a key of the palette. */
export interface Sprite {
  rows: readonly string[];
  /** Cell character → CSS custom property with its colour. */
  palette: Readonly<Record<string, string>>;
}

const INK = { k: '--fg' };

/** The item each side quest would be in a game's inventory. */
export const SPRITES = {
  // PokèVerba: a crossword grid, one square filled in, one lit
  crossword: {
    palette: { ...INK, w: '--surface', a: '--accent', l: '--px-4' },
    rows: [
      'kkkkkkkkkkkkkkkk',
      'kaaaakwwwwkkkkkk',
      'kaaaakwwwwkkkkkk',
      'kaaaakwwwwkkkkkk',
      'kaaaakwwwwkkkkkk',
      'kkkkkkkkkkkkkkkk',
      'kwwwwkllllkwwwwk',
      'kwwwwkllllkwwwwk',
      'kwwwwkllllkwwwwk',
      'kwwwwkllllkwwwwk',
      'kkkkkkkkkkkkkkkk',
      'kkkkkkwwwwkwwwwk',
      'kkkkkkwwwwkwwwwk',
      'kkkkkkwwwwkwwwwk',
      'kkkkkkwwwwkwwwwk',
      'kkkkkkkkkkkkkkkk',
    ],
  },
  // MagSafe card holder: the back of a phone with a card on it
  cardholder: {
    palette: { ...INK, b: '--px-3', p: '--px-6', l: '--px-4', a: '--accent' },
    rows: [
      '...kkkkkkkkkk...',
      '..kbbbbbbbbbbk..',
      '..kbkkkbbbbbbk..',
      '..kbkakbbbbbbk..',
      '..kbkkkbbbbbbk..',
      '..kbbbbbbbbbbk..',
      '..kbkkkkkkkkbk..',
      '..kbkppppppkbk..',
      '..kbkpllllpkbk..',
      '..kbkpllllpkbk..',
      '..kbkpllllpkbk..',
      '..kbkppppppkbk..',
      '..kbkkkkkkkkbk..',
      '..kbbbbbbbbbbk..',
      '...kkkkkkkkkk...',
      '................',
    ],
  },
  // Volkswagen Up storage tray: the little car itself
  car: {
    palette: { ...INK, b: '--px-3', a: '--accent', p: '--px-6', w: '--surface' },
    rows: [
      '................',
      '................',
      '................',
      '....kkkkkkkk....',
      '...kbbbkbbbbk...',
      '..kbbbbkbbbbbk..',
      '.kkkkkkkkkkkkkk.',
      'kaaaaaaaaaaaaaak',
      'kaaaaaaakaaaaapk',
      'kaaaaaaaaaaaaaak',
      'kkkkkkkkkkkkkkkk',
      '..kkkk....kkkk..',
      '.kkwwkk..kkwwkk.',
      '..kkkk....kkkk..',
      '................',
      '................',
    ],
  },
} as const satisfies Record<string, Sprite>;

export type SpriteName = keyof typeof SPRITES;

/**
 * The painted cells grouped into `steps` layers per colour, one path each, with the thresholds of a dissolve that
 * grows upwards: as `--p` goes from 0 to 1 the item builds itself from the bottom, a few pixels at a time.
 */
export function spritePaths(sprite: Sprite, steps: number): (Omit<DissolvePath, 'color'> & { color: string })[] {
  const thresholds = dissolveThresholds(16, 16, 'up');
  const layers = new Map<string, Omit<DissolvePath, 'color'> & { color: string }>();
  sprite.rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const color = sprite.palette[row.charAt(x)];
      if (!color) continue;
      const t = Math.floor((thresholds[y * 16 + x] ?? 0) * steps) / steps;
      const key = `${color}|${String(t)}`;
      const layer = layers.get(key) ?? { t, color, d: '' };
      layer.d += `M${String(x)} ${String(y)}h1v1h-1z`;
      layers.set(key, layer);
    }
  });
  return [...layers.values()];
}
