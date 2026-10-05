import type { Effect } from '../motion-host';

/**
 * Desktop: the experience section is pinned while its entries arrive one by one and stack like a deck, the line
 * growing with them. Phones stack them as sticky cards in CSS, and each card steps back as the next one slides over
 * it. Without motion, desktop shows a plain list.
 */
export const experienceEffect: Effect = (root, { gsap, desktop }) => {
  const section = root.querySelector<HTMLElement>('#experience');
  const list = section?.querySelector<HTMLElement>('ol');
  const items = list ? [...list.querySelectorAll<HTMLElement>(':scope > li')] : [];
  if (!section || !list || items.length < 2) return undefined;

  // phones stack the entries as sticky cards in CSS (experience-timeline.ts): the covered one shrinks away under the next
  if (!desktop) {
    items.slice(0, -1).forEach((item, i) => {
      gsap.to(item, {
        scale: 0.94,
        transformOrigin: '50% 0%',
        ease: 'none',
        scrollTrigger: { trigger: items[i + 1], start: 'top bottom', end: 'top 30%', scrub: true },
      });
    });
    return undefined;
  }

  list.classList.add('is-stacked');
  // the pinned section fills the screen with the deck in the middle
  // the pin starts below the sticky header, so the deck fills the screen under it
  const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0;
  gsap.set(section, { minHeight: `calc(100svh - ${String(header)}px)`, alignContent: 'center' });
  const steps = items.length - 1;
  const deck = gsap.timeline({
    defaults: { ease: 'power2.out' },
    scrollTrigger: {
      trigger: section,
      start: `top ${String(header)}px`,
      end: () => `+=${String(steps * innerHeight * 0.6)}`,
      pin: true,
      scrub: 0.6,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  });
  deck.fromTo(list, { '--progress': 1 / items.length }, { '--progress': 1, duration: steps, ease: 'none' }, 0);
  items.forEach((item, i) => {
    if (i === 0) return;
    // the cards already on the deck step back as the new one arrives on top
    deck.to(items.slice(0, i), { y: '-=14', scale: '-=0.035', duration: 1 }, i - 1);
    // opaque from the start, so the text of the cards below never shows through
    deck.from(item, { yPercent: 130, duration: 1 }, i - 1);
  });
  return () => {
    list.classList.remove('is-stacked');
  };
};
