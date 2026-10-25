import type { Effect } from '../motion-host';
import { watchPause } from '../pause';

/**
 * The ambient orbs drift on slow loops of their own, slide with the scroll, take the tone of the section in view
 * and, on desktop, lean towards the pointer. The pause button stops the loops.
 */
export const ambientEffect: Effect = (root, { gsap, desktop }) => {
  const layer = root.querySelector<HTMLElement>('.ambient');
  if (!layer) return undefined;
  const orbs = [...layer.querySelectorAll<HTMLElement>('.orb')];

  const loops = orbs.map((orb, i) =>
    gsap.to(orb, {
      x: () => `${String(8 + i * 2)}vw`,
      y: () => `${String(i % 2 ? -10 : 9)}vh`,
      scale: 0.8 + (i % 3) * 0.2,
      duration: 8 + i * 1.5,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      delay: -i * 2,
    }),
  );
  const stopWatching = watchPause((paused) => {
    for (const loop of loops) loop.paused(paused);
  });

  // a scroll listener rather than a ScrollTrigger: the layer outlives every route and its page height
  let frame = 0;
  const update = (): void => {
    frame = 0;
    const max = document.documentElement.scrollHeight - innerHeight;
    gsap.set(layer, { yPercent: max > 0 ? (-12 * scrollY) / max : 0 });
  };
  // the tone is sampled a few times a second: scroll events miss the jumps of a ScrollTrigger refresh or a route
  let lastTone = 0;
  const tone = (time: number): void => {
    if (time - lastTone < 0.25) return;
    lastTone = time;
    const section = document.elementFromPoint(innerWidth / 2, innerHeight / 2)?.closest('section[id]');
    layer.dataset['tone'] = section?.id ?? 'top';
  };
  gsap.ticker.add(tone);
  const onScroll = (): void => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  update();
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);

  let onMove: ((e: PointerEvent) => void) | undefined;
  if (desktop) {
    const toX = gsap.quickTo(layer, 'x', { duration: 1.6, ease: 'power3.out' });
    const toY = gsap.quickTo(layer, 'y', { duration: 1.6, ease: 'power3.out' });
    onMove = (e) => {
      toX((e.clientX / innerWidth - 0.5) * 60);
      toY((e.clientY / innerHeight - 0.5) * 60);
    };
    addEventListener('pointermove', onMove, { passive: true });
  }

  return () => {
    stopWatching();
    removeEventListener('scroll', onScroll);
    removeEventListener('resize', onScroll);
    gsap.ticker.remove(tone);
    if (onMove) removeEventListener('pointermove', onMove);
    cancelAnimationFrame(frame);
    delete layer.dataset['tone'];
  };
};
