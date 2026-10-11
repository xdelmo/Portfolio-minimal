// GSAP's ScrollSmoother (issue #159), without importing GSAP: the app shell asks whether it runs, the GSAP chunk starts it.
import type { ScrollSmoother } from 'gsap/ScrollSmoother';

/** sessionStorage key: 'off' keeps the native scroll (the e2e set it, a test about smoothing removes it). */
export const SMOOTH_OFF_KEY = 'smooth-scroll';

/** Desktop with a mouse or a trackpad and no reduced motion: touch keeps its native scroll. */
export const SMOOTH_QUERY = '(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)';

let current: ScrollSmoother | undefined;

export function smoother(): ScrollSmoother | undefined {
  return current;
}

export function setSmoother(s: ScrollSmoother): void {
  current = s;
}

export function wantsSmooth(): boolean {
  try {
    if (sessionStorage.getItem(SMOOTH_OFF_KEY) === 'off') return false;
  } catch {
    // storage blocked: smooth as usual
  }
  return matchMedia(SMOOTH_QUERY).matches && !!document.getElementById('smooth-wrapper');
}
