export const SCROLL_SWING = 0.6; // radians the moai turns either way while its section crosses the screen

/** 0 while the section top is below the middle of the screen, 1 once its bottom is above it. */
export function sectionProgress(top: number, height: number, viewport: number): number {
  return Math.min(1, Math.max(0, (viewport / 2 - top) / height));
}

/** Turns one way and back while the section scrolls: 0 at both ends, so the face is shown and the swap from the still image is invisible. */
export function scrollYaw(progress: number): number {
  return Math.sin(progress * Math.PI * 2) * SCROLL_SWING;
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** The moai bursts into cubes at the end of its section and comes back together on the way up. */
export function explodeAmount(scroll: number): number {
  return smoothstep(0.8, 1, scroll);
}

/** One breath of the idle moai, in milliseconds. */
export const BREATH_MS = 4000;

/** Pitch of the idle moai, in radians: a slow nod of about two degrees. */
export function breath(t: number): number {
  return Math.sin((t / BREATH_MS) * Math.PI * 2) * 0.035;
}

/** Frame-rate independent easing towards `target`; `dt` in milliseconds. */
export function follow(current: number, target: number, dt: number): number {
  const next = target + (current - target) * Math.exp(-dt / 250);
  return Math.abs(next - target) < 1e-4 ? target : next;
}

export type Gaze = 'left-up' | 'left-down' | 'right-up' | 'right-down';

/** Where the moai's pixel pupils look: the quadrant of the pointer around its eyes (`dx`, `dy` in screen px). */
export function gaze(dx: number, dy: number): Gaze {
  return `${dx < 0 ? 'left' : 'right'}-${dy < 0 ? 'up' : 'down'}` as const;
}
