import type { Effect } from '../motion-host';

/**
 * Desktop: the experience deck (title, chapters, cards; the studies stay below in the page flow) is pinned while its jobs arrive one by one and stack like a deck; the chapter track
 * above fills with them, marks the job on top and, when a chapter is clicked, scrolls to the point where its card arrives. Phones stack them as sticky cards in CSS, and each card steps back as the next one slides over
 * it. Without motion, desktop shows a plain list.
 */
export const experienceEffect: Effect = (root, { gsap, desktop }) => {
  const section = root.querySelector<HTMLElement>('#experience .deck');
  const list = section?.querySelector<HTMLElement>('ol.timeline');
  const items = list ? [...list.querySelectorAll<HTMLElement>(':scope > li')] : [];
  const chapters = section ? [...section.querySelectorAll<HTMLAnchorElement>('.chapters a')] : [];
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
  // the pin starts below the sticky header. The deck keeps its own height: stretched to the screen it would leave its
  // spare room above the title and between the cards and the studies once the pin is over
  const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0;
  const steps = items.length - 1;
  // chapter i fills while card i slides onto the deck; the first one is already there
  const track = (progress: number): void => {
    const at = progress * steps;
    const current = Math.min(steps, Math.round(at));
    chapters.forEach((chapter, i) => {
      chapter.style.setProperty('--fill', String(i === 0 ? 1 : Math.min(Math.max(at - (i - 1), 0), 1)));
      if (i === current) chapter.setAttribute('aria-current', 'step');
      else chapter.removeAttribute('aria-current');
    });
  };
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
      onUpdate: (self) => {
        track(self.progress);
      },
      onRefresh: (self) => {
        track(self.progress);
      },
    },
  });
  track(0);
  // inside the pin a card's anchor is not where it arrives: go to that point of the pin instead
  const jump = (event: MouseEvent): void => {
    const i = chapters.indexOf(event.currentTarget as HTMLAnchorElement);
    const pin = deck.scrollTrigger;
    if (i < 0 || !pin) return;
    event.preventDefault();
    scrollTo({ top: pin.start + ((pin.end - pin.start) * i) / steps, behavior: 'smooth' });
    items[i].focus({ preventScroll: true });
  };
  for (const chapter of chapters) chapter.addEventListener('click', jump);
  // Tab into a card still waiting under the deck (its case study link): bring that card on top first, or the focus
  // would sit on something hidden (WCAG 2.4.11)
  const reveal = (event: FocusEvent): void => {
    const i = items.findIndex((item) => item.contains(event.target as Node));
    const pin = deck.scrollTrigger;
    if (i < 0 || !pin) return;
    // a frame later: the browser scrolls the focused element into view after focusin, which would undo this
    requestAnimationFrame(() => {
      // the focus may have moved on meanwhile (a busy frame): never pull the page back to a card left behind
      if (!items[i].contains(document.activeElement)) return;
      scrollTo({ top: pin.start + ((pin.end - pin.start) * i) / steps });
      // no scrub lag: the card is on top at once, where the scroll will keep it
      deck.progress(i / steps);
    });
  };
  list.addEventListener('focusin', reveal);
  items.forEach((item, i) => {
    if (i === 0) return;
    // the cards already on the deck step back as the new one arrives on top
    deck.to(items.slice(0, i), { y: '-=14', scale: '-=0.035', duration: 1 }, i - 1);
    // opaque from the start, so the text of the cards below never shows through
    deck.from(item, { yPercent: 130, duration: 1 }, i - 1);
  });
  return () => {
    list.classList.remove('is-stacked');
    list.removeEventListener('focusin', reveal);
    for (const chapter of chapters) {
      chapter.removeEventListener('click', jump);
      chapter.style.removeProperty('--fill');
      chapter.removeAttribute('aria-current');
    }
  };
};
