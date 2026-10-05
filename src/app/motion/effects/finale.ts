import type { Effect } from '../motion-host';

/**
 * The contact band starts as an inset card with round corners and widens to full bleed as it scrolls in, while
 * the giant title rises line by line with the scroll. The inset never reaches the text, so contrast holds at every
 * step.
 */
export const finaleEffect: Effect = (root, { gsap, SplitText }) => {
  const contact = root.querySelector<HTMLElement>('#contact');
  const title = contact?.querySelector<HTMLElement>('h2');
  if (!contact || !title) return undefined;

  // start state set up front, the scrubbed tweens only move away from it (see stack-orbs.ts)
  // the inset stops short of the text, so the light copy never sits on the light page
  const textLeft = Math.min(...Array.from(contact.querySelectorAll('h2, a, p'), (el) => el.getBoundingClientRect().left));
  const inset = Math.max(0, Math.min(0.06 * document.documentElement.clientWidth, textLeft - 8));
  gsap.set(contact, { '--band-inset': `${String(inset)}px`, '--band-round': '48px' });
  gsap.to(contact, {
    '--band-inset': '0px',
    '--band-round': '0px',
    ease: 'none',
    // clamp(): the contact is the last section, so the page may end before its top reaches 15%
    scrollTrigger: { trigger: contact, start: 'top bottom', end: 'clamp(top 15%)', scrub: true },
  });

  if (title.getBoundingClientRect().top < innerHeight) return undefined;
  // the title holds a link: split its label, so the link and its arrow stay whole
  const split = SplitText.create(title.querySelector('.contact-label') ?? title, { type: 'lines', mask: 'lines' });
  gsap.set(split.lines, { yPercent: 105 });
  gsap.to(split.lines, {
    yPercent: 0,
    stagger: 0.12,
    ease: 'none',
    scrollTrigger: { trigger: contact, start: 'top 85%', end: 'clamp(top 30%)', scrub: true },
  });
  return undefined;
};
