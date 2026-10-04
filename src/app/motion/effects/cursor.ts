import type { Effect } from '../motion-host';

const INTERACTIVE = 'a, button, summary, [role="button"]';
const MAGNET = 8; // px an element can lean towards the pointer

/**
 * Desktop: a pixel trails the pointer and opens into a frame over links and buttons; elements marked
 * `data-magnetic` lean a few pixels towards it. One delegated listener, so every route is covered.
 */
export const cursorEffect: Effect = (root, { gsap, desktop }) => {
  const dot = root.querySelector<HTMLElement>('.pixel-cursor');
  if (!desktop || !dot) return undefined;

  const toX = gsap.quickTo(dot, 'x', { duration: 0.15, ease: 'power3.out' });
  const toY = gsap.quickTo(dot, 'y', { duration: 0.15, ease: 'power3.out' });
  const leaning = new Set<HTMLElement>();
  let shown = false;

  // CSS variables feed `translate` (see _base.scss), so hover transforms still apply on top
  const lean = (el: HTMLElement, x: number, y: number): void => {
    leaning.add(el);
    gsap.to(el, { '--mx': `${String(x)}px`, '--my': `${String(y)}px`, duration: 0.4, ease: 'power3.out', overwrite: 'auto' });
  };
  let magnet: HTMLElement | null = null;

  const onMove = (e: PointerEvent): void => {
    if (e.pointerType !== 'mouse') return;
    if (!shown) {
      gsap.set(dot, { display: 'block', x: e.clientX, y: e.clientY });
      shown = true;
    }
    toX(e.clientX);
    toY(e.clientY);
    const target = e.target instanceof Element ? e.target : null;
    dot.classList.toggle('is-over', !!target?.closest(INTERACTIVE));

    const next = target?.closest<HTMLElement>('[data-magnetic]') ?? null;
    if (magnet && magnet !== next) lean(magnet, 0, 0);
    magnet = next;
    if (magnet) {
      const box = magnet.getBoundingClientRect();
      const dx = (e.clientX - (box.left + box.width / 2)) / (box.width / 2);
      const dy = (e.clientY - (box.top + box.height / 2)) / (box.height / 2);
      lean(magnet, Math.max(-1, Math.min(1, dx)) * MAGNET, Math.max(-1, Math.min(1, dy)) * MAGNET * 0.6);
    }
  };
  const onLeave = (): void => {
    gsap.set(dot, { display: 'none' });
    shown = false;
  };
  addEventListener('pointermove', onMove, { passive: true });
  document.documentElement.addEventListener('pointerleave', onLeave);

  return () => {
    removeEventListener('pointermove', onMove);
    document.documentElement.removeEventListener('pointerleave', onLeave);
    gsap.set(dot, { clearProps: 'all' });
    dot.classList.remove('is-over');
    for (const el of leaning) gsap.set(el, { '--mx': '0px', '--my': '0px' });
  };
};
