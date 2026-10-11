import type { Effect } from '../motion-host';
import { smoother } from '../smoother';

/**
 * With smooth scroll on (desktop, issue #159) the content moves under a transform, where `position: sticky` no longer
 * sticks: each `[data-sticky]` element is pinned instead, at its own `top` and until its parent's end, as sticky did.
 */
export const stickyEffect: Effect = (root, { ScrollTrigger, desktop }) => {
  if (!desktop || !smoother()) return undefined;
  const restore: (() => void)[] = [];
  // sticky follows the layout by itself, a pin keeps the start and end it measured: a section or an element that changes
  // height later (the moai's canvas replacing its still, a font) refreshes them, or the pin ends too early (issue #159,
  // seen once in WebKit: the moai ran away 290 px before the About section's end). Heights are compared, so the
  // refresh's own resizing of the pin spacer does not loop.
  const heights = new Map<Element, number>();
  const sizes = new ResizeObserver((entries) => {
    let changed = false;
    for (const { target } of entries) {
      const h = (target as HTMLElement).offsetHeight;
      if (heights.has(target) && heights.get(target) !== h) changed = true;
      heights.set(target, h);
    }
    if (changed) ScrollTrigger.refresh();
  });
  restore.push(() => {
    sizes.disconnect();
  });
  for (const el of root.querySelectorAll<HTMLElement>('[data-sticky]')) {
    const parent = el.parentElement;
    // only where the layout makes it sticky (each element has its own breakpoint)
    if (!parent || getComputedStyle(el).position !== 'sticky') continue;
    const top = parseFloat(getComputedStyle(el).top) || 0;
    // static and without its sticky top: the pin moves it, and a top left in force added 160 px to the moai, which then
    // ran past the end of the About section by as much (issue #169)
    el.style.position = 'static';
    el.style.top = 'auto';
    restore.push(() => {
      el.style.position = '';
      el.style.top = '';
    });
    sizes.observe(el);
    sizes.observe(parent);
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
