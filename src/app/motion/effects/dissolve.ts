import type { Effect } from '../motion-host';

/**
 * Pixel seams and side quest sprites form as they scroll into view (`--p` 0 → 1). Ones
 * already on screen when the page opens stay as they are, so nothing flickers at load.
 */
export const dissolveEffect: Effect = (root, { gsap }) => {
  for (const el of root.querySelectorAll<HTMLElement>('[data-scrub]')) {
    if (el.getBoundingClientRect().top < innerHeight) continue;
    gsap.set(el, { '--p': 0 });
    gsap.to(el, { '--p': 1, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 45%', scrub: true } });
  }
  return undefined;
};
