import type { Effect } from '../motion-host';
import { smoother } from '../smoother';

/**
 * With smooth scroll on (desktop, issue #159) the content moves under a transform, where `position: sticky` no longer
 * sticks: each `[data-sticky]` element is pinned instead, at its own `top` and until its parent's end, as sticky did.
 */
export const stickyEffect: Effect = (root, { ScrollTrigger, desktop }) => {
  if (!desktop || !smoother()) return undefined;
  const restore: (() => void)[] = [];
  for (const el of root.querySelectorAll<HTMLElement>('[data-sticky]')) {
    const parent = el.parentElement;
    // only where the layout makes it sticky (each element has its own breakpoint)
    if (!parent || getComputedStyle(el).position !== 'sticky') continue;
    const top = parseFloat(getComputedStyle(el).top) || 0;
    el.style.position = 'static';
    restore.push(() => {
      el.style.position = '';
    });
    ScrollTrigger.create({
      trigger: el,
      pin: true,
      pinSpacing: false,
      start: `top ${String(top)}px`,
      endTrigger: parent,
      end: () => `bottom ${String(top + el.offsetHeight)}px`,
      invalidateOnRefresh: true,
    });
  }
  return () => {
    restore.forEach((r) => {
      r();
    });
  };
};
