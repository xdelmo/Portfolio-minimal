// The only place that imports GSAP: loaded lazily by MotionHost, so it stays out of the initial bundle.
// Three imports, one after the other: evaluated together they were one long task at load (Lighthouse TBT).
import type { MotionLib } from './motion-host';
import { setSmoother, wantsSmooth } from './smoother';

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
  // smooth scroll on desktop (issue #159), created before any effect's ScrollTrigger so they all follow it
  if (wantsSmooth()) {
    const { ScrollSmoother } = await import('gsap/ScrollSmoother');
    gsap.registerPlugin(ScrollSmoother);
    // focusing #main after a jump to the top must not snap the smoother to it mid-scroll (issue #609)
    setSmoother(
      ScrollSmoother.create({
        wrapper: '#smooth-wrapper',
        content: '#smooth-content',
        smooth: 1,
        onFocusIn: (_s, e) => (e.target as Element).id !== 'main',
      }),
    );
    document.documentElement.classList.add('smooth');
  }
  return { gsap, ScrollTrigger, SplitText };
}
