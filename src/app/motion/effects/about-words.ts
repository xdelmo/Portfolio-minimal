import type { Effect } from '../motion-host';

/**
 * The About statement lights up word by word as it scrolls through the screen: each word's `--lit` goes 0 → 1, and
 * its colour mixes from --fg-muted to --fg in CSS, so a theme switch mid-way just works.
 */
export const aboutWordsEffect: Effect = (root, { gsap, SplitText }) => {
  const statement = root.querySelector<HTMLElement>('#about .statement');
  if (!statement) return undefined;
  // plain spans read as the sentence: no aria-label (not allowed on a <p>) and nothing hidden
  const split = SplitText.create(statement, { type: 'words', wordsClass: 'word', aria: 'none' });
  gsap.set(split.words, { '--lit': 0 });
  gsap.to(split.words, {
    '--lit': 1,
    ease: 'none',
    stagger: 0.1,
    scrollTrigger: { trigger: statement, start: 'top 85%', end: 'bottom 45%', scrub: true },
  });
  return () => {
    split.revert();
  };
};
