import type { Effect } from '../motion-host';

/**
 * On desktop the hover nudge is CSS (work-list.scss); this only undoes the phone gesture. Phones get the scroll gesture: a project below the fold
 * starts tipped back with its title aside, and straightens as it comes up. On desktop the picture also drifts against the
 * mouse while it is inside, through the unitless --px/--py the stylesheet turns into a translate in px (issue #523).
 */
/** How far the picture drifts at the frame's edge, as a share of each side: under the 2% per side the 1.04 scale in work-list.scss adds, on a 3:2 frame too. */
const DRIFT = 0.018;

export const workHoverEffect: Effect = (root, { gsap, desktop }) => {
  if (!desktop) {
    for (const project of root.querySelectorAll<HTMLElement>('#work .project')) {
      if (project.getBoundingClientRect().top < innerHeight) continue;
      const media = project.querySelector<HTMLElement>('.media');
      const title = project.querySelector<HTMLElement>('h3');
      if (!media || !title) continue;
      const scrollTrigger = { trigger: project, start: 'top bottom', end: 'top 40%', scrub: true };
      gsap.set(media, { transformPerspective: 900, rotationX: 14, rotationY: 0, transformOrigin: '50% 100%' });
      gsap.to(media, { rotationX: 0, ease: 'none', scrollTrigger });
      gsap.set(title, { x: -24 });
      gsap.to(title, { x: 0, ease: 'none', scrollTrigger });
    }
    return undefined;
  }
  const cleanups: (() => void)[] = [];
  for (const project of root.querySelectorAll<HTMLElement>('#work .project')) {
    const media = project.querySelector<HTMLElement>('.media');
    const title = project.querySelector<HTMLElement>('h3');
    if (!media || !title) continue;
    // 300ms, like the scale's CSS transition: back at the centre before the picture shrinks to its frame
    const toX = gsap.quickTo(media, '--px', { duration: 0.3, ease: 'power3.out' });
    const toY = gsap.quickTo(media, '--py', { duration: 0.3, ease: 'power3.out' });
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const r = media.getBoundingClientRect();
      toX(-((e.clientX - r.left) / r.width - 0.5) * 2 * DRIFT * r.width);
      toY(-((e.clientY - r.top) / r.height - 0.5) * 2 * DRIFT * r.height);
    };
    const onLeave = () => {
      toX(0);
      toY(0);
    };
    media.addEventListener('pointermove', onMove);
    media.addEventListener('pointerleave', onLeave);
    cleanups.push(() => {
      media.removeEventListener('pointermove', onMove);
      media.removeEventListener('pointerleave', onLeave);
      gsap.killTweensOf(media, '--px,--py');
      media.style.removeProperty('--px');
      media.style.removeProperty('--py');
    });
    // reset mobile tilt and slide if the window was a phone one a moment ago (issue #109, see motion-host.ts); the
    // hover nudge itself is CSS, stepped like every other hover (work-list.scss, issue #521)
    gsap.set(media, { transformPerspective: 900, rotationX: 0, rotationY: 0 });
    gsap.set(title, { x: 0 });
  }
  return () => {
    for (const cleanup of cleanups) cleanup();
  };
};
