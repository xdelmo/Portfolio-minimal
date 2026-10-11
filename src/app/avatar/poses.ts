import { breath } from '../voxel/motion';

export type Gait = 'idle' | 'walk';
export type Move = 'wave' | 'jump' | 'spin';
export const MOVES: readonly Move[] = ['wave', 'jump', 'spin'];

/** Joint angles in radians, lift in voxels. */
export interface Pose {
  /** swing of each limb around its joint's x axis: positive swings it back */
  armL: number;
  armR: number;
  legL: number;
  legR: number;
  /** the +x arm raised sideways (the wave) */
  armRaise: number;
  /** the head's nod */
  nod: number;
  /** the whole body's extra turn */
  spin: number;
  lift: number;
}

export const REST: Pose = { armL: 0, armR: 0, legL: 0, legR: 0, armRaise: 0, nod: 0, spin: 0, lift: 0 };

/** The walk changes pose 8 times a second, in steps like a sprite, and takes a stride every 8 poses. */
export const STEP_MS = 125;
export const STRIDE = 0.6;

export function walkPose(t: number): Pose {
  const phase = (Math.floor(t / STEP_MS) * Math.PI) / 4;
  const swing = Math.sin(phase) * STRIDE;
  return { ...REST, legL: swing, legR: -swing, armL: -swing, armR: swing, lift: Math.abs(Math.sin(phase)) * 0.5 };
}

export function idlePose(t: number): Pose {
  const sway = breath(t);
  return { ...REST, nod: sway, armL: sway, armR: -sway };
}

export const MOVE_MS: Readonly<Record<Move, number>> = { wave: 1400, jump: 700, spin: 900 };

const ARM_UP = 2.6;
const RAISE_MS = 200;

/** A move started `t` ms ago, or null once it has ended. */
export function movePose(move: Move, t: number): Pose | null {
  const length = MOVE_MS[move];
  if (t >= length || t < 0) return null;
  const k = t / length;
  if (move === 'wave') {
    // up in a fifth of a second, a few waves of the hand, back down
    const up = Math.min(1, t / RAISE_MS, (length - 1 - t) / RAISE_MS);
    return { ...REST, armRaise: up * (ARM_UP + 0.3 * Math.sin((t / 150) * Math.PI)) };
  }
  if (move === 'jump') {
    const arc = 4 * k * (1 - k);
    return { ...REST, lift: 4 * arc, armL: -0.8 * arc, armR: -0.8 * arc, legL: 0.3 * arc, legR: 0.3 * arc };
  }
  const eased = k < 0.5 ? 2 * k * k : 1 - 2 * (1 - k) ** 2;
  return { ...REST, spin: eased * Math.PI * 2, lift: Math.sin(k * Math.PI) };
}
