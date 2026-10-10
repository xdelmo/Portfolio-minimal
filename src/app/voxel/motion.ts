// radians the moai turns towards the viewer while its section crosses the screen: from the camera's 45° to facing it
export const SCROLL_SWING = Math.PI / 4;

/** 0 while the section top is below the middle of the screen, 1 once its bottom is above it. */
export function sectionProgress(top: number, height: number, viewport: number): number {
  return Math.min(1, Math.max(0, (viewport / 2 - top) / height));
}

/** Turns to face the viewer and back while the section scrolls: 0 at both ends, so the swap from the still image is invisible. */
export function scrollYaw(progress: number): number {
  return ((1 - Math.cos(progress * Math.PI * 2)) / 2) * SCROLL_SWING;
}

/** One breath of the idle moai, in milliseconds. */
export const BREATH_MS = 4000;

/** Pitch of the idle moai, in radians: a slow nod of about two degrees. */
export function breath(t: number): number {
  return Math.sin((t / BREATH_MS) * Math.PI * 2) * 0.035;
}

/** Frame-rate independent easing towards `target`; `dt` and the time constant `tau` in milliseconds. */
export function follow(current: number, target: number, dt: number, tau = 250): number {
  const next = target + (current - target) * Math.exp(-dt / tau);
  return Math.abs(next - target) < 1e-4 ? target : next;
}

/** How long the phones' moai holds each glance, in milliseconds. */
export const GLANCE_MS = 2400;
// radians: where it looks in turn; a repeated value is a pause, so it never sways like a metronome. Mostly towards
// the viewer: the camera sits at 45°, and a wide turn the other way would show its profile (see scrollYaw)
const GLANCES = [0, 0, 0.3, 0.3, -0.12, 0, 0, 0.18, 0.18, -0.1, 0, 0] as const;

/**
 * The yaw the phones' moai looks towards at idle time `t` (issue #110): it glances to one side, holds, comes back,
 * looks the other way, instead of spinning on itself. Eased by `follow`, so each turn starts and ends slowly.
 */
export function glance(t: number): number {
  return GLANCES[Math.floor(t / GLANCE_MS) % GLANCES.length];
}

export type Gaze = 'left-up' | 'left-down' | 'right-up' | 'right-down';

/** Where the moai's pixel pupils look: the quadrant of the pointer around its eyes (`dx`, `dy` in screen px). */
export function gaze(dx: number, dy: number): Gaze {
  return `${dx < 0 ? 'left' : 'right'}-${dy < 0 ? 'up' : 'down'}` as const;
}

export const BUBBLE_GROW_MS = 900;
export const BUBBLE_HOLD_MS = 500;
const BUBBLE_POP_MS = 120;
export const BUBBLE_MS = BUBBLE_GROW_MS + BUBBLE_HOLD_MS + BUBBLE_POP_MS;

/**
 * The moai's bubble gum, `t` ms after a double click: its size from 0 to 1 while it inflates (easing out), 1 while
 * it holds, a little more as it pops, then null once it has burst.
 */
export function bubble(t: number): number | null {
  if (t >= BUBBLE_MS) return null;
  if (t < BUBBLE_GROW_MS) return 1 - (1 - t / BUBBLE_GROW_MS) ** 3;
  if (t < BUBBLE_GROW_MS + BUBBLE_HOLD_MS) return 1;
  return 1 + 0.25 * ((t - BUBBLE_GROW_MS - BUBBLE_HOLD_MS) / BUBBLE_POP_MS);
}

/** The model cell the bubble is blown from: the middle of the pursed lips, right under the nose. */
export const GUM_LIPS = { y: 10, z: 4 } as const;

/**
 * Rows the ball hangs below the lips: its top row level with them. Centred on the lips it rose in front of the
 * long nose, and in the isometric view the nose seemed to end in the bubble.
 */
export const GUM_DROP = 3;

/**
 * The bubble as voxels: a ball of radius 3, z = 0 at the mouth and growing towards the viewer, joined to the lips
 * (the row GUM_DROP above its centre) by a neck of pink cubes.
 */
export function bubbleCells(radius = 3): { x: number; y: number; z: number }[] {
  const cells: { x: number; y: number; z: number }[] = [];
  for (let y = -radius; y <= radius; y++) {
    for (let z = 0; z <= 2 * radius; z++) {
      for (let x = -radius; x <= radius; x++) {
        if (x * x + y * y + (z - radius) ** 2 <= radius * radius + 1) cells.push({ x, y, z });
      }
    }
  }
  for (let z = 0; !cells.some((c) => c.x === 0 && c.y === GUM_DROP && c.z === z); z++) cells.push({ x: 0, y: GUM_DROP, z });
  return cells;
}
