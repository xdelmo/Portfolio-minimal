import type { Effect } from '../motion-host';

/**
 * The tool levels come in with the scroll: on desktop the rings turn into place (alternate ways, the outer ones
 * further), on phones the rows step in from the right. Nothing loops afterwards.
 */
export const stackLevelsEffect: Effect = (root, { gsap, desktop }) => {
  const diagram = root.querySelector<HTMLElement>('#stack .levels');
  if (!diagram) return undefined;
  const levels = [...diagram.querySelectorAll<HTMLElement>('.level')];
  // the start state is set up front and the timeline only moves away from it (a scrubbed .from() is not redrawn by
  // Firefox after a refresh)
  levels.forEach((level, i) => {
    gsap.set(level, desktop ? { rotation: (i % 2 ? 1 : -1) * (30 + 20 * i), scale: 0.85 } : { x: 24 * (i + 1) });
  });
  gsap.to(levels, {
    ...(desktop ? { rotation: 0, scale: 1 } : { x: 0 }),
    ease: 'power2.out',
    stagger: 0.08,
    scrollTrigger: { trigger: diagram, start: 'top bottom', end: desktop ? 'center center' : 'top 40%', scrub: 1 },
  });
  return undefined;
};
