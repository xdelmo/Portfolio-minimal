import type { Effect } from '../motion-host';
import { MOAI_TRANSIT, MOAI_TRANSIT_ROWS, moaiTransit } from '../../voxel/moai-transit';

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
 * unbuilds row by row in About and rematerializes from the ground up in the bottom-right corner with its pukao landing
 * last (issue #661), and reverses on the way up. The corner placement goes through CSS variables onto its inner box,
 * never the pinned element, whose box the pin measures at every refresh. In the corner only the small moai itself takes
 * clicks (moai-figure.ts).
 */
export const moaiEffect: Effect = (root, { ScrollTrigger, desktop }) => {
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
  const apply = ({ progress, start, end }: { progress: number; start: number; end: number }): void => {
    const state = moaiTransit(progress);
    if (state.corner) {
      moai.style.setProperty('--moai-s', String(CORNER_PX / moai.offsetHeight));
      // nothing moves the host sideways, and its left is fractional (the About's column): offsets would round it by a pixel
      moai.style.setProperty('--moai-x', `${String(view.clientWidth - CORNER_GAP - moai.getBoundingClientRect().right)}px`);
      // pinned, its foot is `top()` + its height down the window
      moai.style.setProperty('--moai-y', `${String(view.clientHeight - CORNER_GAP - top() - moai.offsetHeight)}px`);
      moai.setAttribute('data-corner', '');
    } else {
      // once the About's foot reaches the pinned moai's feet it stops in the About and rides up with it while it
      // unbuilds (issue #676). From the scroll the trigger is at, never the boxes: under the smoother they hold the
      // previous frame and the moai lagged past the About's foot (issue #674)
      const scroll = start + progress * (end - start);
      const below = progress > 0 ? Math.max(0, scroll - (bottom(about) - top() - moai.offsetHeight)) : 0;
      moai.style.setProperty('--moai-s', '1');
      moai.style.setProperty('--moai-x', '0px');
      moai.style.setProperty('--moai-y', `${String(-below)}px`);
      moai.removeAttribute('data-corner');
    }
    if (progress > 0 && progress < 1) {
      moai.setAttribute('data-transit', state.phase);
      moai.dataset['transitProgress'] = progress.toFixed(4);
      const cutPct = Math.round((1 - Math.max(0, state.cutY) / MOAI_TRANSIT_ROWS) * 100);
      moai.style.setProperty('--moai-clip', `inset(${String(cutPct)}% 0 0 0)`);
    } else {
      moai.removeAttribute('data-transit');
      delete moai.dataset['transitProgress'];
      moai.style.removeProperty('--moai-clip');
    }
    moai.dispatchEvent(new CustomEvent(MOAI_TRANSIT, { detail: progress }));
  };
  const transit = ScrollTrigger.create({
    trigger: about,
    // from the About's foot reaching the pinned moai's feet (never before the pin holds it) to the About gone above
    // the window: it steps off the band as the band ends
    start: () => Math.max(pin.start, bottom(about) - top() - moai.offsetHeight),
    end: () => bottom(about),
    scrub: true,
    invalidateOnRefresh: true,
    onUpdate: apply,
    onRefresh: apply,
  });
  apply(transit);
  return () => {
    moai.removeAttribute('data-corner');
    moai.removeAttribute('data-transit');
    delete moai.dataset['transitProgress'];
    moai.style.removeProperty('--moai-s');
    moai.style.removeProperty('--moai-x');
    moai.style.removeProperty('--moai-y');
    moai.style.removeProperty('--moai-clip');
    moai.dispatchEvent(new CustomEvent(MOAI_TRANSIT, { detail: 0 }));
  };
};
