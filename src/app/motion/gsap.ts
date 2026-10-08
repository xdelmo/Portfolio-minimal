// The only place that imports GSAP: loaded lazily by MotionHost, so it stays out of the initial bundle.
// Three imports, one after the other: evaluated together they were one long task at load (Lighthouse TBT).
import type { MotionLib } from './motion-host';

let loading: Promise<MotionLib> | undefined;

/** The motion hosts of the shell and of the page share one download. */
export function loadGsap(): Promise<MotionLib> {
  return (loading ??= load());
}

async function load(): Promise<MotionLib> {
  const { gsap } = await import('gsap');
  const { ScrollTrigger } = await import('gsap/ScrollTrigger');
  const { SplitText } = await import('gsap/SplitText');
  gsap.registerPlugin(ScrollTrigger, SplitText);
  // iOS toolbars resize the viewport while scrolling; refreshing on that would make pinned sections jump (spec §11)
  ScrollTrigger.config({ ignoreMobileResize: true });
  return { gsap, ScrollTrigger, SplitText };
}
