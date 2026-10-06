import { ARROW_CELLS, arrowCells, pointing } from './arrow';

const has = (cells: readonly (readonly [number, number])[], c: number, r: number) => cells.some(([x, y]) => x === c && y === r);

describe('pixel arrow', () => {
  const mid = (ARROW_CELLS - 1) / 2;

  it('points right at angle 0: the tip is the rightmost cell, on the middle row', () => {
    const cells = arrowCells(0);
    const right = Math.max(...cells.map(([c]) => c));
    expect(cells.filter(([c]) => c === right)).toEqual([[right, mid]]);
    expect(has(cells, 0, mid)).toBe(true);
  });

  it('turns with the angle, on the same grid: down at a quarter turn, up-left along the diagonal', () => {
    const down = arrowCells(Math.PI / 2);
    expect(Math.max(...down.map(([, r]) => r))).toBe(ARROW_CELLS - 1);
    expect(down.filter(([, r]) => r === ARROW_CELLS - 1)).toEqual([[mid, ARROW_CELLS - 1]]);
    // diagonally the tip is one cell in from the corner, the shaft ending one cell in from the opposite one
    const upLeft = arrowCells((-3 * Math.PI) / 4);
    expect(has(upLeft, 1, 1) && has(upLeft, ARROW_CELLS - 2, ARROW_CELLS - 2)).toBe(true);
  });

  it('is mirror-symmetric about its axis and stays inside the grid', () => {
    const cells = arrowCells(0);
    expect(cells.every(([c, r]) => has(cells, c, 2 * mid - r))).toBe(true);
    for (let a = -Math.PI; a < Math.PI; a += 0.1) {
      expect(arrowCells(a).every(([c, r]) => c >= 0 && r >= 0 && c < ARROW_CELLS && r < ARROW_CELLS)).toBe(true);
    }
  });

  it('points at the nearest heading within reach, and at nothing beyond it', () => {
    const near = { left: 100, top: 100, right: 300, bottom: 150 };
    const far = { left: 100, top: 900, right: 300, bottom: 950 };
    // below the first heading: it points up, at its centre
    expect(pointing(200, 250, [far, near])).toBeCloseTo(-Math.PI / 2);
    expect(pointing(200, 600, [far, near])).toBeNull();
    // on the title itself it would hide the words
    expect(pointing(200, 120, [far, near])).toBeNull();
  });
});
