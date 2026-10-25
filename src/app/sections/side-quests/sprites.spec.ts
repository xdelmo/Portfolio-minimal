import { SPRITES, spritePaths } from './sprites';

describe('side quest sprites', () => {
  for (const [name, sprite] of Object.entries(SPRITES)) {
    it(`${name} is 16 × 16 cells drawn only with its palette`, () => {
      expect(sprite.rows).toHaveLength(16);
      for (const row of sprite.rows) {
        expect(row).toHaveLength(16);
        for (const cell of row) expect(cell === '.' || cell in sprite.palette).toBe(true);
      }
    });

    it(`${name} becomes paths that cover exactly its painted cells`, () => {
      const painted = sprite.rows.join('').replaceAll('.', '').length;
      const cells = spritePaths(sprite, 4).reduce((n, layer) => n + (layer.d.match(/M/g)?.length ?? 0), 0);
      expect(cells).toBe(painted);
    });
  }

  it('reveals each colour in a few steps, the same way every time', () => {
    const layers = spritePaths(SPRITES.crossword, 4);
    expect(new Set(layers.map((l) => l.t)).size).toBeLessThanOrEqual(4);
    expect(layers).toEqual(spritePaths(SPRITES.crossword, 4));
  });
});
