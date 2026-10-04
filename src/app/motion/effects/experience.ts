import type { Effect } from '../motion-host';

/**
 * Desktop: the experience section is pinned while its entries arrive one by one and stack like a deck, the line
 * growing with them. Phones: each entry fades up once as it scrolls in. Without motion it stays a plain list.
 */
export const experienceEffect: Effect = (root, { gsap, desktop }) => {
  const section = root.querySelector<HTMLElement>('#experience');
  const list = section?.querySelector<HTMLElement>('ol');
  const items = list ? [...list.querySelectorAll<HTMLElement>(':scope > li')] : [];
  if (!section || !list || items.length < 2) return undefined;

  if (!desktop) {
    for (const item of items) {
      if (item.getBoundingClientRect().top < innerHeight) continue;
      gsap.from(item, { autoAlpha: 0, y: 32, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: item, start: 'top 90%', once: true } });
    }
    return undefined;
  }

  list.classList.add('is-stacked');
  // the pinned section fills the screen with the deck in the middle
  gsap.set(section, { minHeight: '100svh', alignContent: 'center' });
  const steps = items.length - 1;
  const deck = gsap.timeline({
    defaults: { ease: 'power2.out' },
    scrollTrigger: {
      trigger: section,
      start: 'top top',
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
