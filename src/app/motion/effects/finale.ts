import type { Effect } from '../motion-host';

/**
 * The contact band starts as an inset card with round corners and widens to full bleed as it scrolls in, while
 * the giant title rises line by line with the scroll. The dark band is always behind the text, so contrast holds
 * at every step.
 */
export const finaleEffect: Effect = (root, { gsap, SplitText }) => {
  const contact = root.querySelector<HTMLElement>('#contact');
  const title = contact?.querySelector<HTMLElement>('h2');
  if (!contact || !title) return undefined;

  // start state set up front, the scrubbed tweens only move away from it (see stack-orbs.ts)
  gsap.set(contact, { '--band-inset': '6%', '--band-round': '48px' });
  gsap.to(contact, {
    '--band-inset': '0%',
    '--band-round': '0px',
    ease: 'none',
    // clamp(): the contact is the last section, so the page may end before its top reaches 15%
    scrollTrigger: { trigger: contact, start: 'top bottom', end: 'clamp(top 15%)', scrub: true },
  });

  if (title.getBoundingClientRect().top < innerHeight) return undefined;
  const split = SplitText.create(title, { type: 'lines', mask: 'lines' });
  gsap.set(split.lines, { yPercent: 105 });
  gsap.to(split.lines, {
    yPercent: 0,
    stagger: 0.12,
    ease: 'none',
    scrollTrigger: { trigger: contact, start: 'top 85%', end: 'clamp(top 30%)', scrub: true },
  });
  return undefined;
};
