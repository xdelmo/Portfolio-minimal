import type { Effect } from '../motion-host';

/**
 * Pixel seams and side quest sprites form as they scroll into view (`--p` 0 → 1). Ones
 * already on screen when the page opens stay as they are, so nothing flickers at load.
 * Seams also crumble away (`--p` 1 → 0) as they rise towards the header, and form again on the way back.
 */
export const dissolveEffect: Effect = (root, { gsap }) => {
  for (const el of root.querySelectorAll<HTMLElement>('[data-scrub]')) {
    if (el.getBoundingClientRect().top >= innerHeight) {
      gsap.set(el, { '--p': 0 });
      gsap.to(el, { '--p': 1, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 45%', scrub: true } });
    }
    if (el.matches('app-pixel-dissolve')) {
      // after the entry in scroll order, so it only renders once its own range is reached
      gsap.fromTo(el, { '--p': 1 }, { '--p': 0, ease: 'none', immediateRender: false, scrollTrigger: { trigger: el, start: 'top 30%', end: 'top 10%', scrub: true } });
    }
  }
  return undefined;
};
