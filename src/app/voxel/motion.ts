/** The hello the moai waves as the home opens, in milliseconds: under a second. */
export const WAVE_MS = 900;

/** Roll of the moai `t` ms into its hello, in radians: it rocks side to side twice, starting and ending level. */
export function wave(t: number): number {
  if (t < 0 || t > WAVE_MS) return 0;
  return Math.sin((t / WAVE_MS) * Math.PI * 4) * Math.sin((t / WAVE_MS) * Math.PI) * 0.12;
}

/** How long without any input before the moai falls asleep, in milliseconds. */
export const SLEEP_MS = 20_000;

// radians the moai bows its head while the page scrolls: it looks down at what passes by
export const LOOK_DOWN = 0.18;

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
// the viewer: the camera sits at 45°, and a wide turn the other way would show its profile
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

/** Where phones' moai looks, with no pointer to follow: where its face points (also the still image's). */
export const PHONE_GAZE: Gaze = 'left-down';

/** Each eye is a 2×2 block: with a gaze, one voxel (the corner `g` points to) is the pupil and the other three the white. */
export function isPupil(eyes: readonly { x: number; y: number }[], v: { x: number; y: number }, g: Gaze): boolean {
  const mine = eyes.filter((e) => Math.sign(e.x) === Math.sign(v.x));
  const xs = mine.map((e) => e.x);
  const ys = mine.map((e) => e.y);
  return v.x === (g.startsWith('right') ? Math.max(...xs) : Math.min(...xs)) && v.y === (g.endsWith('up') ? Math.max(...ys) : Math.min(...ys));
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

/** The model cell the bubble is blown from: the middle of the pursed lips, two rows below the nose. */
export const GUM_LIPS = { y: 8, z: 4 } as const;

/**
 * The bubble as voxels: a ball of radius 3 centred on the lips, z = 0 on their front face and growing towards the
 * viewer. The lips sit two rows below the nose, so its top row stays clear of the nose's tip.
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
  return cells;
}
