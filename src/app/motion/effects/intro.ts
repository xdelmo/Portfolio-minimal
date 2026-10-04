import { endIntro } from '../intro-state';
import type { Effect } from '../motion-host';

// the pixel palette of src/styles/_tokens.scss
const PIXELS = ['#7fb2ec', '#b9d5f5', '#c9b8f5', '#a8e0c8', '#ffc9a8'];
// the CSS fallback in site-intro.ts lifts the panel at 3s; past that, GSAP must not replay it
const FALLBACK_MS = 2600;

/** Letters light up one after the other, the pixel row fills, then the panel lifts and uncovers the page. */
export const introEffect: Effect = (root, { gsap }) => {
  if (!document.documentElement.classList.contains('intro-on')) return;
  const panel = root.querySelector<HTMLElement>('.site-intro');
  if (!panel || performance.now() > FALLBACK_MS) {
    endIntro();
    return;
  }
  panel.style.animation = 'none';
  gsap
    .timeline({ onComplete: endIntro })
    .to(root.querySelectorAll('.letter'), { opacity: 1, duration: 0.35, stagger: 0.035, ease: 'power2.out' })
    .fromTo(
      root.querySelectorAll('.px'),
      { scale: 0 },
      { scale: 1, backgroundColor: (i: number) => PIXELS[i % PIXELS.length], duration: 0.3, stagger: 0.03, ease: 'back.out(3)' },
      0.1,
    )
    .to(panel, { yPercent: -100, duration: 0.9, ease: 'expo.inOut' }, '+=0.25');
};
