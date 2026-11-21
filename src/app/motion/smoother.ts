/// <reference types="gsap" />
// GSAP's ScrollSmoother (issue #159), without importing GSAP: the app shell asks whether it runs, the GSAP chunk starts it.
import type { ScrollSmoother } from 'gsap/ScrollSmoother';

/** sessionStorage key: 'off' keeps the native scroll (the e2e set it, a test about smoothing removes it). */
export const SMOOTH_OFF_KEY = 'smooth-scroll';

/** Desktop with a mouse or a trackpad and no reduced motion: touch keeps its native scroll. */
export const SMOOTH_QUERY = '(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)';

export let currentSmoother: ScrollSmoother | undefined;
export const smoother = (): ScrollSmoother | undefined => currentSmoother;
export const setSmoother = (s: ScrollSmoother): void => { currentSmoother = s; };

export function wantsSmooth(): boolean {
  try {
    if (sessionStorage.getItem(SMOOTH_OFF_KEY) === 'off') return false;
  } catch {
    // storage blocked: smooth as usual
  }
  return matchMedia(SMOOTH_QUERY).matches && !!document.getElementById('smooth-wrapper');
}

/**
 * Back to the top and the focus to the content: through ScrollSmoother when it runs (a native smooth scroll under it lags
 * twice, issue #609), at once with reduced motion.
 */
export function scrollToTop(): void {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const s = smoother();
  if (s) s.scrollTo(0, !reduce);
  else window.scrollTo({ top: 0, behavior: reduce ? 'instant' : 'smooth' });
  document.getElementById('main')?.focus({ preventScroll: true });
}
