import type { Effect } from '../motion-host';
import { watchPause } from '../pause';

const REACH = 140; // px around the pointer that pushes an orb
const PUSH = 18; // px an orb moves when the pointer is right on it

/**
 * Once on their ring, the stack orbs bob gently on their own and, on desktop, step aside from the pointer.
 * Both go through CSS variables feeding `translate` (stack-list.ts), apart from the scroll-scrubbed transform.
 */
export const stackFloatEffect: Effect = (root, { gsap, desktop }) => {
  const orbs = [...root.querySelectorAll<HTMLElement>('#stack .orb')];
  if (!orbs.length) return undefined;

  const loops = orbs.map((orb, i) =>
    gsap.fromTo(
      orb,
      { '--fy': `${String(i % 2 ? 6 : -6)}px` },
      { '--fy': `${String(i % 2 ? -6 : 6)}px`, duration: 2.4 + i * 0.35, ease: 'sine.inOut', repeat: -1, yoyo: true },
    ),
  );
  const stopWatching = watchPause((paused) => {
    for (const loop of loops) loop.paused(paused);
  });

  let onMove: ((e: PointerEvent) => void) | undefined;
  if (desktop) {
    onMove = (e) => {
      if (e.pointerType !== 'mouse') return;
      for (const orb of orbs) {
        const box = orb.getBoundingClientRect();
        const dx = box.left + box.width / 2 - e.clientX;
        const dy = box.top + box.height / 2 - e.clientY;
        const d = Math.hypot(dx, dy) || 1;
        const k = Math.max(0, 1 - d / REACH);
        gsap.to(orb, { '--rx': `${String((dx / d) * k * PUSH)}px`, '--ry': `${String((dy / d) * k * PUSH)}px`, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
      }
    };
    addEventListener('pointermove', onMove, { passive: true });
  }

  return () => {
    stopWatching();
    if (onMove) removeEventListener('pointermove', onMove);
    for (const orb of orbs) gsap.set(orb, { '--rx': '0px', '--ry': '0px', '--fy': '0px' });
  };
};
