import { afterIntro } from '../intro-state';
import type { Effect } from '../motion-host';

/**
 * After the intro the headline rises line by line; on every visit it drifts and grows as the hero scrolls away (and on
 * desktop widens on its wdth axis, from 75 up to 85 as long as its lines stay the same).
 * Returning visitors never see the headline hidden: the entrance only plays while the intro covers the page.
 */
/** The widest `wdth` (75–85) at which the headline keeps the height, so the lines, it has at 75. */
function widest(title: HTMLElement): number {
  const set = (wdth: number) => {
    title.style.setProperty('--hero-wdth', String(wdth));
  };
  const current = title.style.getPropertyValue('--hero-wdth');
  set(75);
  const height = title.offsetHeight;
  let wdth = 85;
  for (; wdth > 75; wdth--) {
    set(wdth);
    if (title.offsetHeight === height) break;
  }
  title.style.setProperty('--hero-wdth', current);
  return wdth;
}

export const heroEffect: Effect = (root, { gsap, SplitText, desktop }) => {
  const hero = root.querySelector<HTMLElement>('.hero');
  const title = hero?.querySelector<HTMLElement>('h1');
  if (!hero || !title) return;

  if (document.documentElement.classList.contains('intro-on')) {
    const split = SplitText.create(title, { type: 'lines', mask: 'lines' });
    // the buttons stay put at full contrast: fading in after the headline they were the last thing readable, and
    // mid-fade too faint to pass contrast (issue #231)
    const rest = hero.querySelectorAll(':scope > p');
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
  // desktop: the condensed headline also widens on its variable axis as it leaves, and narrows coming back (issue #131),
  // only as far as its lines still break where they did: one more line would make the hero taller and move the page
  const field = hero.querySelector('.field');
  // the field behind the text sinks a little slower than the page, on phones as on desktop
  if (field) gsap.to(field, { y: 90, ease: 'none', scrollTrigger: away });
  if (!desktop) return;
  // whole steps only: every new wdth shapes, lays out and rasterises the giant headline again, and a value that
  // changed at every frame dropped about 40 frames between the hero and the work (issue #233)
  const wdth = { v: 75 };
  // fromTo: a refresh measures the end again but never reads the start back from the page
  gsap.fromTo(wdth, { v: 75 }, {
    v: () => widest(title),
    ease: 'none',
    scrollTrigger: { ...away, invalidateOnRefresh: true },
    onUpdate: () => {
      const step = String(Math.round(wdth.v));
      if (title.style.getPropertyValue('--hero-wdth') !== step) title.style.setProperty('--hero-wdth', step);
    },
  });
  return () => {
    title.style.removeProperty('--hero-wdth');
  };
};
