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
  // the player card's achievements (game/player-card.ts): a graduation cap, a trophy, a phone
  cap: {
    palette: { ...INK, a: '--accent', p: '--px-6' },
    rows: [
      '................',
      '................',
      '.......kk.......',
      '.....kkkkkk.....',
      '...kkkkkkkkkk...',
      '.kkkkkkkkkkkkkk.',
      '...kkkkkkkkkk.p.',
      '.....kkkkkk...p.',
      '....kaaaaaak..p.',
      '....kaaaaaak..p.',
      '....kaaaaaak.ppp',
      '....kaaaaaak.ppp',
      '.....kkkkkk.....',
      '................',
      '................',
      '................',
    ],
  },
  trophy: {
    palette: { ...INK, a: '--accent', p: '--px-6' },
    rows: [
      '................',
      '..kkkkkkkkkkkk..',
      '.kkppppppppppkk.',
      'k.kppppppppppk.k',
      'k.kppppppppppk.k',
      '.kkppppppppppkk.',
      '...kppppppppk...',
      '....kppppppk....',
      '.....kppppk.....',
      '......kppk......',
      '......kppk......',
      '.....kkkkkk.....',
      '....kaaaaaak....',
      '....kaaaaaak....',
      '...kkkkkkkkkk...',
      '................',
    ],
  },
  phone: {
    palette: { ...INK, w: '--surface', a: '--accent', b: '--px-3', l: '--px-4' },
    rows: [
      '....kkkkkkkk....',
      '...kwwwwwwwwk...',
      '...kwkkkkkkwk...',
      '...kwkbbbbkwk...',
      '...kwkbaabkwk...',
      '...kwkbaabkwk...',
      '...kwkbbbbkwk...',
      '...kwkllllkwk...',
      '...kwkllllkwk...',
      '...kwkbbbbkwk...',
      '...kwkkkkkkwk...',
      '...kwwwwwwwwk...',
      '...kwwwkkwwwk...',
      '...kwwwwwwwwk...',
      '....kkkkkkkk....',
      '................',
    ],
  },
  // the Claude Code courses: a terminal with its prompt and cursor
  terminal: {
    palette: { ...INK, w: '--surface', a: '--accent', l: '--px-4' },
    rows: [
      '................',
      '.kkkkkkkkkkkkkk.',
      '.kllllllllllllk.',
      '.kkkkkkkkkkkkkk.',
      '.kwwwwwwwwwwwwk.',
      '.kwkwwwwwwwwwwk.',
      '.kwwkwwwwwwwwwk.',
      '.kwwwkwwwwwwwwk.',
      '.kwwkwwwwwwwwwk.',
      '.kwkwwaaaawwwwk.',
      '.kwwwwaaaawwwwk.',
      '.kwwwwwwwwwwwwk.',
      '.kwwwwwwwwwwwwk.',
      '.kkkkkkkkkkkkkk.',
      '................',
      '................',
    ],
  },
  // the player card: more than ten years on the drums, a snare and its sticks
  drum: {
    palette: { ...INK, w: '--surface', a: '--accent', p: '--px-6' },
    rows: [
      '..p..........p..',
      '...p........p...',
      '....p......p....',
      '.....p....p.....',
      '..kkkkkkkkkkkk..',
      '.kwwwwwwwwwwwwk.',
      'kwwwwwwwwwwwwwwk',
      'kkwwwwwwwwwwwwkk',
      'kakkkkkkkkkkkkak',
      'kaaaaaaaaaaaaaak',
      'kaaaaaaaaaaaaaak',
      'kaaaaaaaaaaaaaak',
      'kkaaaaaaaaaaaakk',
      '.kkkkkkkkkkkkkk.',
      '................',
      '................',
    ],
  },
  // the player card: a World of Warcraft raider
  sword: {
    palette: { ...INK, w: '--surface', a: '--accent' },
    rows: [
      '..............kk',
      '.............kwk',
      '............kwk.',
      '...........kwk..',
      '..........kwk...',
      '.........kwk....',
      '........kwk.....',
      '..k....kwk......',
      '..kk..kwk.......',
      '...kkkwk........',
      '....kak.........',
      '...kakkk........',
      '..kak..kk.......',
      '.kak............',
      'kkk.............',
      '................',
    ],
  },
  // the player card: team pizza
  pizza: {
    palette: { ...INK, w: '--surface', p: '--px-6', l: '--px-4' },
    rows: [
      '................',
      '.kkkkkkkkkkkkkk.',
      '.kppppppppppppk.',
      '.kppppppppppppk.',
      '..kwwwwwwwwwwk..',
      '..kwllwwwwwwwk..',
      '...kwllwwwllk...',
      '...kwwwwwwllk...',
      '....kwwwllwk....',
      '....kwwwllwk....',
      '.....kwwwwk.....',
      '.....kwllwk.....',
      '......kwwk......',
      '......kwwk......',
      '.......kk.......',
      '................',
    ],
  },
  // Telegram bots, in the work list: a little robot with its antenna lit
  robot: {
    palette: { ...INK, w: '--surface', a: '--accent', l: '--px-4' },
    rows: [
      '.......kk.......',
      '.......aa.......',
      '.......kk.......',
      '...kkkkkkkkkk...',
      '..kwwwwwwwwwwk..',
      '..kwkkwwwwkkwk..',
      '..kwkakwwkakwk..',
      '..kwkkwwwwkkwk..',
      '.kkwwwwwwwwwwkk.',
      '.kkwwwkkkkwwwkk.',
      '..kwwwwwwwwwwk..',
      '...kkkkkkkkkk...',
      '.....kllllk.....',
      '...kkllllllkk...',
      '..kllllllllllk..',
      '..kkkkkkkkkkkk..',
    ],
  },
  // MCP server, in the work list: the plug a model uses to reach a tool
  plug: {
    palette: { ...INK, a: '--accent', b: '--px-2' },
    rows: [
      '.....k....k.....',
      '.....k....k.....',
      '.....k....k.....',
      '...kkkkkkkkkk...',
      '...kaaaaaaaak...',
      '...kaaaaaaaak...',
      '...kabaaaaaak...',
      '....kaaaaaak....',
      '.....kkkkkk.....',
      '.......kk.......',
      '.......kk.......',
      '........kk......',
      '.........kk.....',
      '..........kk....',
      '...........kkk..',
      '................',
    ],
  },
  // the 404 page (pages/not-found/): the wild creature a broken link runs into
  wild404: {
    palette: { ...INK, l: '--px-4', p: '--px-6', w: '--surface' },
    rows: [
      '................',
      '.....kkkkkk.....',
      '...kkllllllkk...',
      '..kllllllllllk..',
      '.kllllllllllllk.',
      '.kllkkllllkkllk.',
      '.kllkwllllkwllk.',
      'kllllllllllllllk',
      'klppllllllllpplk',
      'klllllkkkklllllk',
      'kllllllllllllllk',
      'kllllllllllllllk',
      'kllllllllllllllk',
      'kllllllllllllllk',
      'kllkkllkkllkkllk',
      '.kk..kk..kk..kk.',
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
