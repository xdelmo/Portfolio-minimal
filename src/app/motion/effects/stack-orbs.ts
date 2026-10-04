import type { Effect } from '../motion-host';

// where each orb starts, as a fraction of the viewport, before it gathers onto the ring
const SCATTER = [
  { x: -0.28, y: -0.35 },
  { x: 0.32, y: 0.12 },
  { x: -0.18, y: 0.4 },
  { x: 0.24, y: -0.3 },
];

/** The stack orbs drift in from scattered places and settle on the ring as the section reaches mid-screen. */
export const stackOrbsEffect: Effect = (root, { gsap }) => {
  const diagram = root.querySelector<HTMLElement>('#stack .orbs');
  if (!diagram) return undefined;
  const orbs = diagram.querySelectorAll<HTMLElement>('.orb');
  const ring = diagram.querySelector('.ring');
  // the scattered state is set up front and the timeline only moves towards the ring: a scrubbed .from() is not
  // redrawn by Firefox after ScrollTrigger's refresh, which left the orbs on the ring from the start
  orbs.forEach((orb, i) => {
    const from = SCATTER[i % SCATTER.length];
    gsap.set(orb, { x: from.x * innerWidth, y: from.y * innerHeight, scale: 0.55, rotation: (i - 1) * 40 });
  });
  gsap.set(ring, { scale: 0.6, autoAlpha: 0 });
  gsap
    .timeline({
      defaults: { ease: 'power2.out', duration: 1 },
      scrollTrigger: { trigger: diagram, start: 'top bottom', end: 'center center', scrub: 1 },
    })
    .to(orbs, { x: 0, y: 0, scale: 1, rotation: 0 }, 0)
    .to(ring, { scale: 1, autoAlpha: 1 }, 0.1);
};
