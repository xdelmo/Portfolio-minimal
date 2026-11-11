import { endIntro, introFits } from '../intro-state';
import type { Effect } from '../motion-host';

// the pixel palette of src/styles/_tokens.scss
const PIXELS = ['#7fb2ec', '#b9d5f5', '#c9b8f5', '#dccff8', '#ffc9a8'];

/** Letters light up one after the other, the pixel row fills, then the panel lifts and uncovers the page. */
export const introEffect: Effect = (root, { gsap, desktop }) => {
  if (!document.documentElement.classList.contains('intro-on')) return undefined;
  const panel = root.querySelector<HTMLElement>('.site-intro');
  if (!panel) {
    endIntro();
    return undefined;
  }
  let deadline = 0;
  const complete = () => {
    window.clearTimeout(deadline);
    endIntro(true);
  };
  const intro = gsap
    .timeline({ paused: true, onComplete: complete })
    .to(root.querySelectorAll('.letter'), { opacity: 1, duration: 0.35, stagger: 0.035, ease: 'power2.out' })
    .fromTo(
      root.querySelectorAll('.px'),
      { scale: 0 },
      { scale: 1, backgroundColor: (i: number) => PIXELS[i % PIXELS.length], duration: 0.3, stagger: 0.03, ease: 'back.out(3)' },
      0.1,
    )
    .addLabel('lift')
    .to(panel, { yPercent: -100, duration: 0.9, ease: 'expo.inOut' }, '+=0.25');
  // phones lift the panel by 2s, not 3.6s (issue #381: a longer cover cost the mobile Speed Index), so the same
  // timeline plays faster there; seconds() turns its own time into real seconds
  const speed = desktop ? 1 : 1.6;
  intro.timeScale(speed);
  const seconds = (t: number) => t / speed;
  // the motion script came late (a slow phone, a busy CI): replaying the intro now would hold the page past the
  // CSS fallback, so the fallback finishes the lift
  // the CSS animation starts with the first render, not with the navigation: its own start time is the reference
  const [anim] = panel.getAnimations() as (Animation | undefined)[];
  const animStart = typeof anim?.startTime === 'number' ? anim.startTime : null;
  const currentTime = typeof anim?.currentTime === 'number' ? anim.currentTime : 0;
  const cssStart = animStart ?? (performance.now() - currentTime);
  // the fallback's own delay and length, so the CSS in site-intro.ts stays the one place that sets them
  const timing = anim?.effect?.getTiming();
  const liftMs = Number(timing?.duration) || 600;
  const cssMs = (timing?.delay ?? 0) + liftMs;
  if (!introFits(performance.now(), seconds(intro.duration()), cssStart, cssMs)) {
    if (getComputedStyle(panel).visibility === 'hidden') {
      intro.revert();
      endIntro();
      return undefined;
    }
    // the letters and the squares still reach their end state (issue #251: without it they stay dim and black
    // under the panel): animated if they fit before the fallback starts to lift, snapped to it otherwise
    // only the animated letters count as seen: a snapped intro or one GSAP missed plays again on the next load (issue #404)
    const animated = introFits(performance.now(), seconds(intro.labels['lift'] ?? 0), cssStart - liftMs, cssMs);
    if (animated) intro.tweenTo('lift');
    else intro.seek('lift');
    panel.addEventListener(
      'animationend',
      () => {
        endIntro(animated);
      },
      { once: true },
    );
    return undefined;
  }
  panel.style.animation = 'none';
  intro.play();
  // a busy main thread stretches the timeline (GSAP's lag smoothing slows its clock down), so the CSS fallback's
  // deadline still holds: the page is never covered for longer than the fallback would have covered it
  const remainingDeadline = Math.max(seconds(intro.duration()) * 1000, cssStart + cssMs - performance.now());
  deadline = window.setTimeout(() => {
    intro.progress(1);
  }, remainingDeadline);
  // a revert (reduced motion switched on, a resize across the desktop query) kills the timeline: end the intro
  // anyway, or the opaque panel would stay put with its CSS fallback turned off
  return () => {
    window.clearTimeout(deadline);
    endIntro();
  };
};
