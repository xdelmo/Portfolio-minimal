/** Scrolling up by less than this keeps the header away: a thumb's wobble or the bounce at a page's end is not a turn. */
export const REVEAL_PX = 8;

/**
 * Whether the header hides (issue #324): it slides away as the page scrolls down and comes back as soon as it scrolls
 * up, and it is always there at the top of the page (`y` within the header's own height).
 */
export function headerHidden(hidden: boolean, y: number, delta: number, headerHeight: number): boolean {
  if (y <= headerHeight) return false;
  if (delta > 0) return true;
  if (delta <= -REVEAL_PX) return false;
  return hidden;
}
