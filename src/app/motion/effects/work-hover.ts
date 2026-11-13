import type { Effect } from '../motion-host';

/**
 * On desktop the hover nudge is CSS (work-list.scss); this only undoes the phone gesture. Phones get the scroll gesture: a project below the fold
 * starts tipped back with its title aside, and straightens as it comes up.
 */
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
  for (const project of root.querySelectorAll<HTMLElement>('#work .project')) {
    const media = project.querySelector<HTMLElement>('.media');
    const title = project.querySelector<HTMLElement>('h3');
    if (!media || !title) continue;
    // reset mobile tilt and slide if the window was a phone one a moment ago (issue #109, see motion-host.ts); the
    // hover nudge itself is CSS, stepped like every other hover (work-list.scss, issue #521)
    gsap.set(media, { transformPerspective: 900, rotationX: 0, rotationY: 0 });
    gsap.set(title, { x: 0 });
  }
  return undefined;
};
