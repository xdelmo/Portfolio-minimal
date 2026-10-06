import { endIntro, introFits } from '../intro-state';
import type { Effect } from '../motion-host';

// the pixel palette of src/styles/_tokens.scss
const PIXELS = ['#7fb2ec', '#b9d5f5', '#c9b8f5', '#dccff8', '#ffc9a8'];

/** Letters light up one after the other, the pixel row fills, then the panel lifts and uncovers the page. */
export const introEffect: Effect = (root, { gsap }) => {
  if (!document.documentElement.classList.contains('intro-on')) return undefined;
  const panel = root.querySelector<HTMLElement>('.site-intro');
  if (!panel) {
    endIntro();
    return undefined;
  }
  const intro = gsap
    .timeline({ paused: true, onComplete: endIntro })
    .to(root.querySelectorAll('.letter'), { opacity: 1, duration: 0.35, stagger: 0.035, ease: 'power2.out' })
    .fromTo(
      root.querySelectorAll('.px'),
      { scale: 0 },
      { scale: 1, backgroundColor: (i: number) => PIXELS[i % PIXELS.length], duration: 0.3, stagger: 0.03, ease: 'back.out(3)' },
      0.1,
    )
    .to(panel, { yPercent: -100, duration: 0.9, ease: 'expo.inOut' }, '+=0.25');
  // the motion script came late (a slow phone, a busy CI): replaying the intro now would hold the page past the
  // CSS fallback's 3.6s, so the fallback finishes the lift
  if (!introFits(performance.now(), intro.duration())) {
    intro.revert();
    if (getComputedStyle(panel).visibility === 'hidden') endIntro();
    else panel.addEventListener('animationend', endIntro, { once: true });
    return undefined;
  }
  panel.style.animation = 'none';
  intro.play();
  // a revert (reduced motion switched on, a resize across the desktop query) kills the timeline: end the intro
  // anyway, or the opaque panel would stay put with its CSS fallback turned off
  return () => {
    endIntro();
  };
};
