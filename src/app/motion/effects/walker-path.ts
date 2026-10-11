import { AVATAR_BLEED, AVATAR_FRAME } from '../../avatar/avatar.model';

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Everything in the coordinates of the layer's offset parent (the home page), in CSS px. */
export interface WalkerGeometry {
  /** The still image in the hero: the layer stands on it at full size. */
  slot: Box;
  /** The middle of the thread, where the soles walk. */
  threadX: number;
  trailTop: number;
  trailBottom: number;
  /** Where the soles stop in the contact band. */
  end: number;
  /** The layer's height on the thread. */
  small: number;
}

/** Progress (0…1) of the three stretches: hero to thread, down the thread, into the contact band. */
export interface WalkerProgress {
  hero: number;
  trail: number;
  contact: number;
}

/** The layer's box (scaled from its top left corner) and where it is. */
export interface WalkerPlace extends Box {
  scale: number;
  where: 'hero' | 'thread';
}

/** How far down the layer the soles are: the figure is centred in a frame AVATAR_FRAME times its size. */
export const FEET = 1 - (AVATAR_FRAME - 1) / 2 / AVATAR_FRAME;

const lerp = (a: number, b: number, k: number): number => a + (b - a) * k;

/**
 * In the hero the layer keeps the slot's size and shrinks with `scale` towards the top of the thread; once there it
 * takes the small size for real (scale 1), so the canvas stops drawing pixels nobody sees.
 */
export function walkerPlace(p: WalkerProgress, g: WalkerGeometry): WalkerPlace {
  const w = g.slot.w * (1 + 2 * AVATAR_BLEED);
  const h = g.slot.h;
  if (p.hero < 1) {
    const scale = lerp(1, g.small / h, p.hero);
    const feetX = lerp(g.slot.x + g.slot.w / 2, g.threadX, p.hero);
    const feetY = lerp(g.slot.y + h * FEET, g.trailTop, p.hero);
    return { x: feetX - (w * scale) / 2, y: feetY - h * scale * FEET, w, h, scale, where: 'hero' };
  }
  const small = { w: (g.small * w) / h, h: g.small };
  const feetY = p.contact > 0 ? lerp(g.trailBottom, g.end, p.contact) : lerp(g.trailTop, g.trailBottom, p.trail);
  return { x: g.threadX - small.w / 2, y: feetY - small.h * FEET, ...small, scale: 1, where: 'thread' };
}
