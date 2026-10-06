import { BUBBLE_GROW_MS, BUBBLE_HOLD_MS, BUBBLE_MS, GUM_DROP, GUM_LIPS, bubble, bubbleCells, BREATH_MS, SCROLL_SWING, breath, follow, gaze, scrollYaw, sectionProgress } from './motion';
import { moaiCell } from './moai.model';

describe('moai motion', () => {
  it('measures how far the section has scrolled past the middle of the screen', () => {
    expect(sectionProgress(1000, 800, 900)).toBe(0);
    expect(sectionProgress(450, 800, 900)).toBe(0);
    expect(sectionProgress(50, 800, 900)).toBeCloseTo(0.5);
    expect(sectionProgress(-1000, 800, 900)).toBe(1);
  });

  // the camera sits at 45°: turning the other way would show its profile while the text beside it is being read
  it('turns the moai towards the viewer in the middle of its section, never away, and back at both ends', () => {
    expect(scrollYaw(0)).toBe(0);
    expect(scrollYaw(0.5)).toBeCloseTo(SCROLL_SWING);
    expect(scrollYaw(1)).toBeCloseTo(0);
    for (let p = 0; p <= 1; p += 0.05) expect(scrollYaw(p)).toBeGreaterThanOrEqual(0);
  });

  it('breathes: a small pitch that returns every BREATH_MS', () => {
    expect(breath(0)).toBeCloseTo(0);
    expect(Math.abs(breath(BREATH_MS / 4))).toBeGreaterThan(0.01);
    expect(Math.abs(breath(BREATH_MS / 4))).toBeLessThan(0.08);
    expect(breath(BREATH_MS)).toBeCloseTo(0);
  });

  it('follows a target smoothly, whatever the frame time', () => {
    expect(follow(0, 1, 0)).toBe(0);
    const step = follow(0, 1, 16);
    expect(step).toBeGreaterThan(0);
    expect(step).toBeLessThan(1);
    expect(follow(0, 1, 10_000)).toBeCloseTo(1);
  });

  it('lands exactly on the target once close, so a still scene stops changing', () => {
    expect(follow(0.99995, 1, 16)).toBe(1);
  });
});

describe('gaze', () => {
  it('looks towards the quadrant the pointer is in, seen from the moai', () => {
    expect(gaze(-100, -50)).toBe('left-up');
    expect(gaze(80, -10)).toBe('right-up');
    expect(gaze(-5, 200)).toBe('left-down');
    expect(gaze(300, 1)).toBe('right-down');
  });
});

describe('bubble', () => {
  it('grows from nothing to full size, holds, then pops', () => {
    expect(bubble(0)).toBe(0);
    expect(bubble(BUBBLE_GROW_MS / 2)).toBeGreaterThan(0.4);
    expect(bubble(BUBBLE_GROW_MS)).toBe(1);
    expect(bubble(BUBBLE_GROW_MS + BUBBLE_HOLD_MS / 2)).toBe(1);
  });

  it('swells a little as it pops, then is gone for good', () => {
    expect(bubble(BUBBLE_GROW_MS + BUBBLE_HOLD_MS + 40)).toBeGreaterThan(1);
    expect(bubble(BUBBLE_MS)).toBeNull();
    expect(bubble(BUBBLE_MS + 5000)).toBeNull();
  });

  it('never shrinks while it grows', () => {
    let previous = 0;
    for (let t = 0; t <= BUBBLE_GROW_MS; t += 50) {
      const size = bubble(t) ?? 0;
      expect(size).toBeGreaterThanOrEqual(previous);
      previous = size;
    }
  });
});

describe('bubbleCells', () => {
  it('is a ball of voxels in front of the lips, symmetric left to right', () => {
    const cells = bubbleCells();
    expect(cells.length).toBeGreaterThan(20);
    expect(cells.every((c) => c.z >= 0)).toBe(true);
    const key = (c: { x: number; y: number; z: number }) => `${String(c.x)},${String(c.y)},${String(c.z)}`;
    const all = new Set(cells.map(key));
    expect(cells.every((c) => all.has(key({ ...c, x: -c.x })))).toBe(true);
  });
});

describe('GUM_LIPS', () => {
  it('is the middle of the lips, under the nose: the bubble comes out of the mouth', () => {
    expect(moaiCell(0, GUM_LIPS.y, GUM_LIPS.z)).toBe('stoneDark');
    expect(moaiCell(0, GUM_LIPS.y + 1, GUM_LIPS.z)).toBe('stoneLight');
  });

  it('hangs the bubble from the lips, all of it below the nose, so the nose never seems to blow it', () => {
    const rows = bubbleCells().map((c) => GUM_LIPS.y + c.y - GUM_DROP);
    expect(Math.max(...rows)).toBe(GUM_LIPS.y);
  });
});
