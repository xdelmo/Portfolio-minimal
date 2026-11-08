import type { Effect } from '../motion-host';

/**
 * The tool levels come in with the scroll: each level's tools slide in from the right, the deeper levels from
 * further, and settle as the section reaches the screen. The rules and the level names stay put. Nothing loops.
 */
export const stackLevelsEffect: Effect = (root, { gsap }) => {
  const rows = [...root.querySelectorAll<HTMLElement>('#stack .level ul')];
  if (!rows.length) return undefined;
  // the start state is set up front and the timeline only moves away from it (a scrubbed .from() is not redrawn by
  // Firefox after a refresh); the same properties on desktop and phones (issue #109, see motion-host.ts)
  rows.forEach((row, i) => {
    gsap.set(row, { x: 48 * (i + 1) });
  });
  gsap.to(rows, {
    x: 0,
    ease: 'power3.out',
    stagger: 0.08,
    scrollTrigger: { trigger: '#stack .levels', start: 'top bottom', end: 'top 40%', scrub: 1 },
  });
  return undefined;
};
