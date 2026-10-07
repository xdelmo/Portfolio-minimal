/** Cells across the cursor's arrow (8px each, so 56px: close to the 40px frame over links). */
export const ARROW_CELLS = 7;
/** How close (px from its words) the pointer must be for the cursor to point at a heading: eight cells, close by. */
export const ARROW_REACH = 64;

/**
 * The arrow redrawn on the pixel grid for `angle` (radians, 0 = right, clockwise as on screen): cells stay square
 * and upright, only which ones are lit changes. Drawn as lines, a shaft and two wings like the ↗ beside the contact
 * title, because a filled head turns into a blob on a 7-cell grid at most angles.
 */
export function arrowCells(angle: number): [number, number][] {
  const mid = (ARROW_CELLS - 1) / 2;
  const lit = new Map<string, [number, number]>();
  const line = (fromX: number, fromY: number, toX: number, toY: number): void => {
    const steps = Math.ceil(Math.hypot(toX - fromX, toY - fromY) * 4);
    for (let i = 0; i <= steps; i++) {
      // nudged off the .5 boundaries so both halves of the arrow round the same way
      const c = Math.round(fromX + ((toX - fromX) * i) / steps + 1e-6 * Math.sign(toX - fromX));
      const r = Math.round(fromY + ((toY - fromY) * i) / steps);
      if (c >= 0 && r >= 0 && c < ARROW_CELLS && r < ARROW_CELLS) lit.set(`${String(c)},${String(r)}`, [c, r]);
    }
  };
  const at = (a: number, length: number, fromX = mid, fromY = mid): [number, number] => [fromX + Math.cos(a) * length, fromY + Math.sin(a) * length];
  const [tipX, tipY] = at(angle, mid);
  const [tailX, tailY] = at(angle + Math.PI, mid);
  line(tailX, tailY, tipX, tipY);
  for (const side of [-1, 1]) {
    const [wingX, wingY] = at(angle + Math.PI + (side * Math.PI) / 4, mid - 0.5, tipX, tipY);
    line(tipX, tipY, wingX, wingY);
  }
  return [...lit.values()];
}

interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** The angle from the pointer to the centre of the nearest box within ARROW_REACH; null when none is that close, or the pointer is on one. */
export function pointing(x: number, y: number, boxes: readonly Box[]): number | null {
  let best: Box | null = null;
  let bestGap = ARROW_REACH;
  for (const b of boxes) {
    const gap = Math.hypot(Math.max(b.left - x, 0, x - b.right), Math.max(b.top - y, 0, y - b.bottom));
    // on the words themselves the arrow would cover them: the plain pixel is back
    if (gap === 0) return null;
    if (gap <= bestGap) {
      best = b;
      bestGap = gap;
    }
  }
  return best ? Math.atan2((best.top + best.bottom) / 2 - y, (best.left + best.right) / 2 - x) : null;
}
