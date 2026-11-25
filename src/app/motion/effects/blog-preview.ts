import type { Effect } from '../motion-host';

const DRIFT_X = 12;
const DRIFT_Y = 16;

/**
 * Desktop: hovering a blog index row linked to a project shifts its `.post-preview` card gently with the pointer
 * through `--px` and `--py`. Phones and reduced motion leave the static layout untouched.
 */
export const blogPreviewEffect: Effect = (root, { gsap, desktop }) => {
  const previews = [...root.querySelectorAll<HTMLElement>('.posts .post-preview')];
  if (!desktop) {
    for (const preview of previews) {
      preview.style.removeProperty('--px');
      preview.style.removeProperty('--py');
    }
    return undefined;
  }

  const cleanups: (() => void)[] = [];
  for (const item of root.querySelectorAll<HTMLElement>('.posts .post-item')) {
    const preview = item.querySelector<HTMLElement>('.post-preview');
    if (!preview) continue;
    const toX = gsap.quickTo(preview, '--px', { duration: 0.25, ease: 'power3.out' });
    const toY = gsap.quickTo(preview, '--py', { duration: 0.25, ease: 'power3.out' });

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const r = item.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const nx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2));
      const ny = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2));
      toX(nx * DRIFT_X);
      toY(ny * DRIFT_Y);
    };

    const onLeave = () => {
      toX(0);
      toY(0);
    };

    item.addEventListener('pointermove', onMove, { passive: true });
    item.addEventListener('pointerleave', onLeave);
    cleanups.push(() => {
      item.removeEventListener('pointermove', onMove);
      item.removeEventListener('pointerleave', onLeave);
      gsap.killTweensOf(preview, '--px,--py');
      preview.style.removeProperty('--px');
      preview.style.removeProperty('--py');
    });
  }

  return () => {
    for (const cleanup of cleanups) cleanup();
  };
};
