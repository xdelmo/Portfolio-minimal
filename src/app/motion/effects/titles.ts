import type { Effect } from '../motion-host';

/** Section titles rise out of a mask line by line as they scroll in; titles already on screen are left alone. */
export const titlesEffect: Effect = (root, { gsap, SplitText }) => {
  for (const title of root.querySelectorAll<HTMLElement>('section:not(.hero) h2')) {
    if (title.getBoundingClientRect().top < innerHeight) continue;
    const split = SplitText.create(title, { type: 'lines', mask: 'lines' });
    gsap.from(split.lines, {
      yPercent: 110,
      duration: 1,
      stagger: 0.08,
      ease: 'expo.out',
      scrollTrigger: { trigger: title, start: 'top 88%', once: true },
      onComplete: () => {
        split.revert();
      },
    });
  }
};
