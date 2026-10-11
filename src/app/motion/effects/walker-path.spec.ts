import { describe, expect, it } from 'vitest';
import { FEET, type WalkerGeometry, walkerPlace } from './walker-path';

const geo: WalkerGeometry = {
  slot: { x: 800, y: 100, w: 200, h: 450 },
  threadX: 60,
  trailTop: 900,
  trailBottom: 5000,
  end: 5600,
  small: 80,
};
/** Where the soles are and how tall the layer looks, whatever mode it is in. */
const seen = (p: ReturnType<typeof walkerPlace>) => ({
  x: p.x + (p.w * p.scale) / 2,
  y: p.y + p.h * p.scale * FEET,
  h: p.h * p.scale,
});

describe('walkerPlace', () => {
  it('stands on the slot in the hero at full size', () => {
    const p = walkerPlace({ hero: 0, trail: 0, contact: 0 }, geo);
    expect(p.where).toBe('hero');
    expect(p.scale).toBe(1);
    expect(seen(p)).toEqual({ x: 900, y: 100 + 450 * FEET, h: 450 });
  });

  it('shrinks onto the top of the thread, and takes the small size there without a jump', () => {
    const arriving = seen(walkerPlace({ hero: 0.999999, trail: 0, contact: 0 }, geo));
    const arrived = walkerPlace({ hero: 1, trail: 0, contact: 0 }, geo);
    expect(arrived.where).toBe('thread');
    expect(arrived.scale).toBe(1);
    expect(arrived.h).toBe(80);
    expect(seen(arrived).x).toBeCloseTo(60);
    expect(seen(arrived).y).toBeCloseTo(900);
    expect(arriving.x).toBeCloseTo(seen(arrived).x, 1);
    expect(arriving.y).toBeCloseTo(seen(arrived).y, 1);
    expect(arriving.h).toBeCloseTo(seen(arrived).h, 1);
  });

  it('keeps its soles on the tip of the thread, then walks into the contact band', () => {
    expect(seen(walkerPlace({ hero: 1, trail: 0.5, contact: 0 }, geo)).y).toBeCloseTo(2950);
    expect(seen(walkerPlace({ hero: 1, trail: 1, contact: 0 }, geo)).y).toBeCloseTo(5000);
    expect(seen(walkerPlace({ hero: 1, trail: 1, contact: 1 }, geo)).y).toBeCloseTo(5600);
  });

  it('keeps the same width to height ratio in both modes', () => {
    const hero = walkerPlace({ hero: 0, trail: 0, contact: 0 }, geo);
    const thread = walkerPlace({ hero: 1, trail: 0.3, contact: 0 }, geo);
    expect(thread.w / thread.h).toBeCloseTo(hero.w / hero.h);
  });
});
