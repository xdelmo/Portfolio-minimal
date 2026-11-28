import { HOP_MS, STRETCH_MS, hop, stretch } from './motion';
import { DIZZY_MS, PUKAO_MS, SNEEZE_MS, pukaoFall, sneeze, wobble } from './motion';
import { BUBBLE_GROW_MS, BUBBLE_HOLD_MS, BUBBLE_MS, GUM_LIPS, bubble, bubbleCells, BREATH_MS, GLANCE_MS, SLEEP_MS, WAVE_MS, breath, follow, frontierToken, gaze, glance, isPupil, wave } from './motion';
import { MOAI_TRANSIT_GAP, MOAI_TRANSIT_ROWS, moaiTransit } from './moai-transit';
import { MOAI_BOUNDS, moaiCell } from './moai.model';

describe('moai motion', () => {
  it('waves hello once: a small roll that starts and ends level, and is still outside its second', () => {
    expect(wave(-1)).toBe(0);
    expect(wave(0)).toBeCloseTo(0);
    expect(wave(WAVE_MS)).toBeCloseTo(0);
    expect(wave(WAVE_MS + 1)).toBe(0);
    expect(WAVE_MS).toBeLessThan(1000);
    const rolls = Array.from({ length: 19 }, (_, i) => wave((WAVE_MS * (i + 1)) / 20));
    expect(Math.max(...rolls)).toBeGreaterThan(0.05);
    expect(Math.min(...rolls)).toBeLessThan(-0.05);
    for (const r of rolls) expect(Math.abs(r)).toBeLessThan(0.2);
  });

  it('falls asleep after 20 s without input', () => {
    expect(SLEEP_MS).toBe(20_000);
  });

  it('breathes: a small pitch that returns every BREATH_MS', () => {
    expect(breath(0)).toBeCloseTo(0);
    expect(Math.abs(breath(BREATH_MS / 4))).toBeGreaterThan(0.01);
    expect(Math.abs(breath(BREATH_MS / 4))).toBeLessThan(0.08);
    expect(breath(BREATH_MS)).toBeCloseTo(0);
  });

  // issue #110: on phones it looks around instead of spinning on itself
  it('glances around on phones: small turns with pauses, a full cycle and again, never a spin', () => {
    const cycle = Array.from({ length: 12 }, (_, i) => glance(i * GLANCE_MS + 1));
    for (const yaw of cycle) expect(Math.abs(yaw)).toBeLessThanOrEqual(0.3);
    expect(new Set(cycle).size).toBeGreaterThan(2);
    expect(cycle.some((yaw, i) => i > 0 && yaw === cycle[i - 1])).toBe(true);
    expect(glance(12 * GLANCE_MS + 1)).toBe(cycle[0]);
  });

  it('follows more slowly with a longer time constant', () => {
    expect(follow(0, 1, 100, 700)).toBeLessThan(follow(0, 1, 100));
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

describe('pupils', () => {
  const eyes = [-3, -2, 2, 3].flatMap((x) => [15, 16].map((y) => ({ x, y })));

  it('puts one pupil in each eye, in the corner the gaze points to', () => {
    const pupils = eyes.filter((e) => isPupil(eyes, e, 'left-down'));
    expect(pupils).toEqual([
      { x: -3, y: 15 },
      { x: 2, y: 15 },
    ]);
    expect(eyes.filter((e) => isPupil(eyes, e, 'right-up'))).toEqual([
      { x: -2, y: 16 },
      { x: 3, y: 16 },
    ]);
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

  it('starts on the lips: a cell on their front face, in the middle of the mouth', () => {
    expect(bubbleCells()).toContainEqual({ x: 0, y: 0, z: 0 });
  });
});

describe('GUM_LIPS', () => {
  it('is the middle of the lips, two rows below the nose: the bubble comes out of the mouth', () => {
    expect(moaiCell(0, GUM_LIPS.y, GUM_LIPS.z)).toBe('stoneDark');
    expect(moaiCell(0, GUM_LIPS.y + 1, GUM_LIPS.z)).toBeNull();
    expect(moaiCell(0, GUM_LIPS.y + 2, GUM_LIPS.z)).toBeNull();
    expect(moaiCell(0, GUM_LIPS.y + 3, GUM_LIPS.z)).toBe('stoneLight');
  });

  it('keeps the bubble in front of the nose tip, never inside it', () => {
    for (const c of bubbleCells()) expect(moaiCell(c.x, GUM_LIPS.y + c.y, GUM_LIPS.z + 1 + c.z)).toBeNull();
  });
});

describe('hop and stretch', () => {
  for (const [name, move, ms] of [['hop', hop, HOP_MS], ['stretch', stretch, STRETCH_MS]] as const) {
    it(`${name}: four held poses, then still`, () => {
      const poses = new Set<string>();
      for (let t = 0; t < ms; t += 5) poses.add(JSON.stringify(move(t)));
      expect(poses.size).toBe(4);
      expect(move(-1)).toBeNull();
      expect(move(ms)).toBeNull();
    });
  }
  it('lifts the hop off the ground and lands it', () => {
    expect(hop(HOP_MS / 4)?.y).toBeGreaterThan(0);
    expect(hop(HOP_MS - 1)?.y).toBe(0);
  });
});

describe('the gags', () => {
  it('drops the pukao beside the moai, holds it there and puts it back in steps', () => {
    expect(pukaoFall(-1)).toBeNull();
    expect(pukaoFall(0)).toEqual({ x: 1, y: -2 });
    expect(pukaoFall(1000)).toEqual({ x: 8, y: -22 });
    expect(pukaoFall(PUKAO_MS - 1)).toEqual({ x: 0, y: 0 });
    expect(pukaoFall(PUKAO_MS)).toBeNull();
    // it never sinks below the ground it lands on
    for (let t = 0; t < PUKAO_MS; t += 50) expect(pukaoFall(t)?.y).toBeGreaterThanOrEqual(-22);
  });

  it('sneezes back then forward, and wobbles in held steps, ending still', () => {
    expect(sneeze(0)).toBeLessThan(0);
    expect(sneeze(350)).toBeGreaterThan(0);
    expect(sneeze(SNEEZE_MS)).toBe(0);
    expect(new Set(Array.from({ length: 10 }, (_, i) => wobble(i * 150)))).toEqual(new Set([0.08, 0, -0.08]));
    expect(wobble(DIZZY_MS)).toBe(0);
  });
});

describe('moaiTransit', () => {
  it('rests whole in About at 0 and in the corner at 1', () => {
    expect(MOAI_TRANSIT_ROWS).toBe(MOAI_BOUNDS.maxY + 1);
    expect(moaiTransit(-0.2)).toEqual({
      phase: 'about',
      corner: false,
      cutY: MOAI_BOUNDS.maxY + 1,
      frontier: false,
      pukaoVisible: true,
      pukaoLift: 0,
      shadow: 1,
      tilt: 0,
      sy: 1,
    });
    expect(moaiTransit(0)).toEqual(moaiTransit(-0.2));
    expect(moaiTransit(1)).toEqual({
      phase: 'corner',
      corner: true,
      cutY: MOAI_BOUNDS.maxY + 1,
      frontier: false,
      pukaoVisible: true,
      pukaoLift: 0,
      shadow: 1,
      tilt: 0,
      sy: 1,
    });
    expect(moaiTransit(1.4)).toEqual(moaiTransit(1));
  });

  it('unbuilds monotonically top-down during the About exit phase', () => {
    const [exitEnd] = MOAI_TRANSIT_GAP;
    let prevY = MOAI_BOUNDS.maxY + 1;
    for (let p = 0.02; p < exitEnd; p += 0.03) {
      const s = moaiTransit(p);
      expect(s.phase).toBe('about');
      expect(s.corner).toBe(false);
      expect(s.frontier).toBe(true);
      expect(s.cutY).toBeLessThanOrEqual(prevY);
      expect(s.cutY).toBeGreaterThanOrEqual(0);
      expect(s.pukaoVisible).toBe(s.cutY >= 22);
      prevY = s.cutY;
    }
    expect(prevY).toBeLessThanOrEqual(2);
  });

  // the shadow goes with the last row, not before it, on the way out and on the way in (issue #676)
  it('keeps the whole shadow while any row shows', () => {
    for (let p = 0.01; p < 1; p += 0.01) {
      const s = moaiTransit(p);
      expect(s.shadow, `at ${p.toFixed(2)}`).toBe(s.phase === 'gap' ? 0 : 1);
    }
  });

  it('clears the scene during the seam gap and flips corner placement at 0.5', () => {
    const [exitEnd, enterStart] = MOAI_TRANSIT_GAP;
    const beforeMid = moaiTransit(exitEnd);
    const afterMid = moaiTransit(enterStart);
    expect(beforeMid.phase).toBe('gap');
    expect(beforeMid.corner).toBe(false);
    expect(beforeMid.pukaoVisible).toBe(false);
    expect(beforeMid.shadow).toBe(0);
    expect(moaiTransit(0.5).corner).toBe(true);
    expect(afterMid.phase).toBe('gap');
    expect(afterMid.corner).toBe(true);
    expect(afterMid.cutY).toBe(-1);
  });

  it('rematerializes bottom-up in the corner, keeps pukao hidden until body finishes, then drops it and settles', () => {
    const [, enterStart] = MOAI_TRANSIT_GAP;
    let prevY = 0;
    for (let t = 0.05; t < 0.8; t += 0.08) {
      const s = moaiTransit(enterStart + t * (1 - enterStart));
      expect(s.phase).toBe('corner');
      expect(s.corner).toBe(true);
      expect(s.frontier).toBe(true);
      expect(s.pukaoVisible).toBe(false);
      expect(s.cutY).toBeGreaterThanOrEqual(prevY);
      expect(s.cutY).toBeLessThanOrEqual(21);
      prevY = s.cutY;
    }
    const drops = [0.81, 0.86, 0.91].map((t) => moaiTransit(enterStart + t * (1 - enterStart)));
    expect(drops.every((d) => d.pukaoVisible && !d.frontier)).toBe(true);
    expect(drops.map((d) => d.pukaoLift)).toEqual([5, 2.5, 0.5]);

    const settleSquash = moaiTransit(enterStart + 0.95 * (1 - enterStart));
    const settleStretch = moaiTransit(enterStart + 0.98 * (1 - enterStart));
    expect(settleSquash.pukaoLift).toBe(0);
    expect(settleSquash.sy).toBeLessThan(1);
    expect(settleStretch.sy).toBeGreaterThan(1);
  });

  it('picks a deterministic pastel token for frontier voxels', () => {
    const a = frontierToken(1, 14, 2);
    const b = frontierToken(1, 14, 2);
    expect(a).toBe(b);
    expect(['--px-1', '--px-4', '--px-6']).toContain(a);
  });
});
