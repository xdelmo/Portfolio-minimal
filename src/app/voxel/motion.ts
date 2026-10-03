import { easeOutCubic } from '../pixel-field/field';

export const SCROLL_TURNS = 0.75; // turns of the moai while its section crosses the screen
export const ENTRY_MS = 900;
export const TURN_STEP = Math.PI / 6;

/** 0 while the section top is below the middle of the screen, 1 once its bottom is above it. */
export function sectionProgress(top: number, height: number, viewport: number): number {
  return Math.min(1, Math.max(0, (viewport / 2 - top) / height));
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** Cubes fly in when the moai first appears (`entry` 0 → 1) and burst out at the end of the section. */
export function explodeAmount(scroll: number, entry: number): number {
  return Math.max(smoothstep(0.8, 1, scroll), 1 - easeOutCubic(entry));
}

/** Frame-rate independent smoothing: `rate` is per second, `dt` in milliseconds. */
export function approach(current: number, target: number, rate: number, dt: number): number {
  return target + (current - target) * Math.exp((-rate * dt) / 1000);
}
