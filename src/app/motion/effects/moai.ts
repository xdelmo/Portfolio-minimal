import type { Effect } from '../motion-host';

/** The moai's height in the corner, and its distance from the window's edges (issue #270). */
export const CORNER_PX = 140;
export const CORNER_GAP = 16;
/** Where the moai stops below the header, as `position: sticky` held it before (--space-8). */
const PIN_GAP = 64;

/** Where the element's foot sits in the page, transforms aside: offsets ignore them, the smoother's and the effect's own. */
function bottom(el: HTMLElement) {
  let top = 0;
  for (let n: HTMLElement | null = el; n; n = n.offsetParent as HTMLElement | null) top += n.offsetTop;
  return top + el.offsetHeight;
}

/**
 * Desktop: the About's moai follows the page from the About down. It is pinned once it reaches its place below the header
 * until the end of the page (fixed, or moved by transform under the smoother), beside the About's text at full size, then
 * shrinks into the bottom-right corner as the About scrolls away, and grows back on the way up. The shrink goes through
 * CSS variables onto its inner box, never the pinned element, whose box the pin measures at every refresh. No
 * `pinReparent`: a reparented pin stays fixed while it is measured, and a refresh with the page scrolled (a resize, coming
 * back to the home) put it out of the window. In the corner only the small moai itself takes clicks (moai-figure.ts).
 */
export const moaiEffect: Effect = (root, { gsap, ScrollTrigger, desktop }) => {
  const about = root.querySelector<HTMLElement>('#about');
  const moai = about?.querySelector<HTMLElement>('.about-moai');
  if (!desktop || !about || !moai) return undefined;
  const view = document.documentElement;
  const top = () => (document.querySelector('header')?.offsetHeight ?? 0) + PIN_GAP;
  const pin = ScrollTrigger.create({
    trigger: moai,
    pin: true,
    pinSpacing: false,
    start: () => `top ${String(top())}px`,
    end: 'max',
  });
  // fromTo: a `to` re-reads its start on every refresh, and read in the corner it was the corner itself
  gsap.fromTo(
    moai,
    { '--moai-s': 1, '--moai-x': '0px', '--moai-y': '0px' },
    {
      '--moai-s': () => CORNER_PX / moai.offsetHeight,
      // nothing moves the host sideways, and its left is fractional (the About's column): offsets would round it by a pixel
      '--moai-x': () => `${String(view.clientWidth - CORNER_GAP - moai.getBoundingClientRect().right)}px`,
      // pinned, its foot is `top()` + its height down the window
      '--moai-y': () => `${String(view.clientHeight - CORNER_GAP - top() - moai.offsetHeight)}px`,
      ease: 'none',
      scrollTrigger: {
        trigger: about,
        // from the About's foot reaching the pinned moai's feet (never before the pin holds it) to the About gone above
        // the window: it steps off the band as the band ends
        start: () => Math.max(pin.start, bottom(about) - top() - moai.offsetHeight),
        end: () => bottom(about),
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: ({ progress }) => {
          moai.toggleAttribute('data-corner', progress > 0);
        },
      },
    },
  );
  return () => {
    moai.removeAttribute('data-corner');
  };
};
