import { endIntro, introFits } from '../intro-state';
import type { Effect } from '../motion-host';

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
      // the colour site-intro.ts gives each square
      { scale: 1, backgroundColor: (_: number, px: HTMLElement) => getComputedStyle(px).getPropertyValue('--c'), duration: 0.3, stagger: 0.03, ease: 'back.out(3)' },
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
  // the CSS lights the letters and the squares itself after its --d (issue #481): once it has started, GSAP leaves it
  const [lit] = (root.querySelector('.letter')?.getAnimations() ?? []) as (Animation | undefined)[];
  const cssPlaying = Number(lit?.currentTime ?? 0) > (lit?.effect?.getTiming().delay ?? 0);
  if (cssPlaying || !introFits(performance.now(), seconds(intro.duration()), cssStart, cssMs)) {
    intro.revert();
    // GSAP missed the whole intro: it plays again on the next load (issue #404)
    if (getComputedStyle(panel).visibility === 'hidden') {
      endIntro();
      return undefined;
    }
    // the letters' and the squares' own animationend bubble up here too
    const lifted = (event: AnimationEvent) => {
      if (event.target !== panel) return;
      panel.removeEventListener('animationend', lifted);
      endIntro(true);
    };
    panel.addEventListener('animationend', lifted);
    return undefined;
  }
  panel.style.animation = 'none';
  panel.classList.add('gsap');
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
