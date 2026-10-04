// The only place that imports GSAP: loaded lazily by MotionHost, so it stays out of the initial bundle.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);
// iOS toolbars resize the viewport while scrolling; refreshing on that would make pinned sections jump (spec §11)
ScrollTrigger.config({ ignoreMobileResize: true });

export { gsap, ScrollTrigger, SplitText };
