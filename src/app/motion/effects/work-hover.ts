import type { Effect } from '../motion-host';

/**
 * On desktop, hovering a project slides the title in subtly. Phones get the scroll gesture: a project below the fold
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
  const offs: (() => void)[] = [];
  for (const project of root.querySelectorAll<HTMLElement>('#work .project')) {
    const media = project.querySelector<HTMLElement>('.media');
    const title = project.querySelector<HTMLElement>('h3');
    if (!media || !title) continue;
    // reset mobile tilt and slide if the window was a phone one a moment ago (issue #109, see motion-host.ts)
    gsap.set(media, { transformPerspective: 900, rotationX: 0, rotationY: 0 });
    gsap.set(title, { x: 0 });
    const enter = (): void => {
      gsap.to(title, { x: 12, duration: 0.5, ease: 'power3.out' });
    };
    const leave = (): void => {
      gsap.to(title, { x: 0, duration: 0.5, ease: 'power3.out' });
    };
    project.addEventListener('pointerenter', enter);
    project.addEventListener('pointerleave', leave);
    offs.push(() => {
      project.removeEventListener('pointerenter', enter);
      project.removeEventListener('pointerleave', leave);
    });
  }
  return () => {
    for (const off of offs) off();
  };
};
