import { afterIntro } from '../intro-state';
import type { Effect } from '../motion-host';

/**
 * After the intro the headline rises line by line; on every visit it drifts and grows as the hero scrolls away.
 * Returning visitors never see the headline hidden: the entrance only plays while the intro covers the page.
 */
export const heroEffect: Effect = (root, { gsap, SplitText }) => {
  const hero = root.querySelector<HTMLElement>('.hero');
  const title = hero?.querySelector<HTMLElement>('h1');
  if (!hero || !title) return;

  if (document.documentElement.classList.contains('intro-on')) {
    const split = SplitText.create(title, { type: 'lines', mask: 'lines' });
    // the lede paragraph fades in right after the headline lines rise (issue #231, #339)
    const rest = hero.querySelectorAll('.copy > p');
    const entrance = gsap
      .timeline({
        paused: true,
        onComplete: () => {
          split.revert();
        },
      })
      .from(split.lines, { yPercent: 110, duration: 1.1, stagger: 0.08, ease: 'expo.out' })
      .from(rest, { autoAlpha: 0, y: 24, duration: 0.8, stagger: 0.08, ease: 'power3.out', clearProps: 'all' }, 0.2);
    afterIntro(() => {
      entrance.play();
    });
  }

  const away = { trigger: hero, start: 'top top', end: 'bottom top', scrub: true };
  gsap.to(title, { yPercent: -18, scale: 1.08, transformOrigin: '0% 100%', ease: 'none', scrollTrigger: away });
};
