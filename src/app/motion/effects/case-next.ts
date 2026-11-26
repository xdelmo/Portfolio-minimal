import type { Effect } from '../motion-host';

const DRIFT = 0.018;

/**
 * Case study footer link to the next project: phones tip the card back below the fold and straighten it on scroll;
 * desktop lifts it gently into view and drifts `.next-media` against the mouse pointer through `--px` and `--py`.
 */
export const caseNextEffect: Effect = (root, { gsap, desktop }) => {
  const card = root.querySelector<HTMLElement>('.more .next');
  if (!card) return undefined;
  const media = card.querySelector<HTMLElement>('.next-media');

  if (!desktop) {
    if (media) {
      media.style.removeProperty('--px');
      media.style.removeProperty('--py');
    }
    gsap.set(card, { transformPerspective: 900, rotationX: 0, y: 0 });
    if (card.getBoundingClientRect().top >= innerHeight) {
      gsap.set(card, { transformPerspective: 900, rotationX: 10, y: 24, transformOrigin: '50% 100%' });
      gsap.to(card, {
        rotationX: 0,
        y: 0,
        ease: 'none',
        scrollTrigger: { trigger: card, start: 'top bottom', end: 'clamp(bottom bottom)', scrub: true },
      });
    }
    return undefined;
  }

  gsap.set(card, { transformPerspective: 900, rotationX: 0, y: 0 });
  if (card.getBoundingClientRect().top >= innerHeight) {
    gsap.set(card, { y: 24 });
    gsap.to(card, {
      y: 0,
      ease: 'none',
      scrollTrigger: { trigger: card, start: 'top bottom', end: 'clamp(bottom bottom)', scrub: true },
    });
  }

  if (!media) return undefined;
  const toX = gsap.quickTo(media, '--px', { duration: 0.3, ease: 'power3.out' });
  const toY = gsap.quickTo(media, '--py', { duration: 0.3, ease: 'power3.out' });

  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    const r = media.getBoundingClientRect();
    if (!r.width || !r.height) return;
    toX(-((e.clientX - r.left) / r.width - 0.5) * 2 * DRIFT * r.width);
    toY(-((e.clientY - r.top) / r.height - 0.5) * 2 * DRIFT * r.height);
  };
  const onLeave = () => {
    toX(0);
    toY(0);
  };

  media.addEventListener('pointermove', onMove, { passive: true });
  media.addEventListener('pointerleave', onLeave);
  return () => {
    media.removeEventListener('pointermove', onMove);
    media.removeEventListener('pointerleave', onLeave);
    gsap.killTweensOf(media, '--px,--py');
    media.style.removeProperty('--px');
    media.style.removeProperty('--py');
  };
};
