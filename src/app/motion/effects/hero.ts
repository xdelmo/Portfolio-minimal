import { afterIntro } from '../intro-state';
import type { Effect } from '../motion-host';
import { CLOSE_END, CLOSE_START, FIELD_EXIT } from '../../pixel-field/field';

/**
 * After the intro the headline rises line by line; on every visit it drifts and grows as the hero scrolls away.
 * Returning visitors never see the headline hidden: the entrance only plays while the intro covers the page.
 * Leaving, the text fades, the cloud closes over the clearing and then crumbles with the hero seam (issue #593).
 */
export const heroEffect: Effect = (root, { gsap, SplitText }) => {
  const hero = root.querySelector<HTMLElement>('.hero');
  const title = hero?.querySelector<HTMLElement>('h1');
  if (!hero || !title) return;

  if (document.documentElement.classList.contains('intro-on')) {
    const split = SplitText.create(title, { type: 'lines', mask: 'lines' });
    // the lede paragraph fades in right after the headline lines rise (issue #231, #339)
    const rest = hero.querySelectorAll('.copy > p');
    // the masks are as tall as a line (line-height 0.98): their overflow cut the descenders, which popped in on revert
    // (issue #586). Clip 0.3em below instead, and start the lines low enough (135%) to stay hidden under it
    gsap.set(split.masks, { overflow: 'visible', clipPath: 'inset(-0.5em -0.5em -0.3em -0.5em)' });
    const entrance = gsap
      .timeline({
        paused: true,
        onComplete: () => {
          split.revert();
        },
      })
      .from(split.lines, { yPercent: 135, duration: 1.1, stagger: 0.08, ease: 'expo.out' })
      .from(rest, { autoAlpha: 0, y: 24, duration: 0.8, stagger: 0.08, ease: 'power3.out', clearProps: 'all' }, 0.2);
    afterIntro(() => {
      entrance.play();
    });
  }

  const copy = hero.querySelector('.copy');
  const field = hero.querySelector('app-pixel-field');
  const seam = hero.querySelector('.seam--hero');
  const exit = (p: number): void => {
    field?.dispatchEvent(new CustomEvent(FIELD_EXIT, { detail: p }));
  };
  if (seam) gsap.set(seam, { '--p': 1 });
  const tl = gsap.timeline({
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
    defaults: { ease: 'none' },
    onUpdate: () => {
      exit(tl.progress());
    },
  });
  tl.to(title, { yPercent: -18, scale: 1.08, transformOrigin: '0% 100%', duration: 1 }, 0);
  // plain opacity, not autoAlpha: the link stays focusable, and focusing it scrolls the text back
  if (copy) tl.to(copy, { opacity: 0, duration: CLOSE_START }, 0);
  if (seam) tl.to(seam, { '--p': 0, duration: 1 - CLOSE_END }, CLOSE_END);
  // reduced motion switched on mid-page: matchMedia reverts the tweens, the cloud opens again too
  return () => {
    exit(0);
  };
};
