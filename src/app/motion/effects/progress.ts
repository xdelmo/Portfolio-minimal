import type { Effect } from '../motion-host';

/** The reading-progress bar: its width follows how far the page has been scrolled. */
export const progressEffect: Effect = (root, { gsap }) => {
  const bar = root.querySelector<HTMLElement>('.scroll-progress');
  if (!bar) return undefined;
  let frame = 0;
  const update = (): void => {
    frame = 0;
    const max = document.documentElement.scrollHeight - innerHeight;
    gsap.set(bar, { scaleX: max > 0 ? Math.min(1, scrollY / max) : 0 });
  };
  // a scroll listener instead of a ScrollTrigger: the page height changes with every route
  const onScroll = (): void => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  update();
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  return () => {
    removeEventListener('scroll', onScroll);
    removeEventListener('resize', onScroll);
    cancelAnimationFrame(frame);
  };
};
