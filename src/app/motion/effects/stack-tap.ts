import type { Effect } from '../motion-host';

const PICK_MS = 1600;

/**
 * A tap (or a click) on a stack orb pulses it in pixel steps and outlines its group of tools for a moment. The orbs
 * stay decorative: the list of groups is the content, this only points at it.
 */
export const stackTapEffect: Effect = (root) => {
  const diagram = root.querySelector<HTMLElement>('#stack .orbs');
  const orbs = [...root.querySelectorAll<HTMLElement>('#stack .orb')];
  const groups = [...root.querySelectorAll<HTMLElement>('#stack .group')];
  if (!diagram || !orbs.length) return undefined;
  let timer = 0;

  const onDown = (e: PointerEvent): void => {
    const orb = (e.target as Element).closest<HTMLElement>('.orb');
    const i = orb ? orbs.indexOf(orb) : -1;
    if (!orb || i < 0) return;
    clearTimeout(timer);
    for (const group of groups) group.classList.remove('is-picked');
    // 'scale' adds to the transform GSAP gives the orbs; a new tap starts a new pulse
    orb.animate([{ scale: 1 }, { scale: 1.15 }, { scale: 1 }], { duration: 360, easing: 'steps(3)' });
    groups[i]?.classList.add('is-picked');
    timer = window.setTimeout(() => {
      groups[i]?.classList.remove('is-picked');
    }, PICK_MS);
  };
  diagram.addEventListener('pointerdown', onDown);
  return () => {
    clearTimeout(timer);
    diagram.removeEventListener('pointerdown', onDown);
    for (const group of groups) group.classList.remove('is-picked');
  };
};
