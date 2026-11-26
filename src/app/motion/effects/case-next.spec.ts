import type { Motion } from '../motion-host';
import { caseNextEffect } from './case-next';

function fakeMotion(desktop: boolean) {
  const values = new Map<HTMLElement, Record<string, number>>();
  const setCalls: [unknown, unknown][] = [];
  const toCalls: [unknown, unknown][] = [];
  const killTweensOf = vi.fn();
  const gsap = {
    set: (target: unknown, vars: unknown) => setCalls.push([target, vars]),
    to: (target: unknown, vars: unknown) => toCalls.push([target, vars]),
    quickTo: (el: HTMLElement, prop: string) => (val: number) => {
      const current = values.get(el) ?? {};
      current[prop] = val;
      values.set(el, current);
    },
    killTweensOf,
  };
  return {
    motion: { gsap, ScrollTrigger: {}, SplitText: {}, desktop } as unknown as Motion,
    values,
    setCalls,
    toCalls,
    killTweensOf,
  };
}

describe('caseNextEffect', () => {
  function setupDOM(top: number) {
    const root = document.createElement('div');
    const more = document.createElement('nav');
    more.className = 'more';
    const card = document.createElement('a');
    card.className = 'next';
    card.getBoundingClientRect = () => ({ left: 0, top, width: 600, height: 200, right: 600, bottom: top + 200, x: 0, y: top, toJSON: () => ({}) });
    const media = document.createElement('div');
    media.className = 'next-media';
    media.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 100, right: 200, bottom: 100, x: 0, y: 0, toJSON: () => ({}) });
    card.append(media);
    more.append(card);
    root.append(more);
    return { root, card, media };
  }

  it('tracks desktop mouse drift on .next-media and cleans up listeners', () => {
    const { root, media } = setupDOM(1200);
    const { motion, values, toCalls, killTweensOf } = fakeMotion(true);
    const cleanup = caseNextEffect(root, motion);

    expect(toCalls).toHaveLength(1);
    media.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'mouse', clientX: 200, clientY: 100 }));
    expect(values.get(media)?.['--px']).toBeCloseTo(-3.6, 4);
    expect(values.get(media)?.['--py']).toBeCloseTo(-1.8, 4);

    media.dispatchEvent(new PointerEvent('pointerleave'));
    expect(values.get(media)).toEqual({ '--px': 0, '--py': 0 });

    media.style.setProperty('--px', '2px');
    cleanup?.();
    expect(killTweensOf).toHaveBeenCalledWith(media, '--px,--py');
    expect(media.style.getPropertyValue('--px')).toBe('');
  });

  it('resets desktop variables and configures phone tilt scroll below the fold', () => {
    const { root, media } = setupDOM(1200);
    media.style.setProperty('--px', '3px');
    media.style.setProperty('--py', '4px');
    const { motion, setCalls, toCalls } = fakeMotion(false);
    const cleanup = caseNextEffect(root, motion);

    expect(cleanup).toBeUndefined();
    expect(media.style.getPropertyValue('--px')).toBe('');
    expect(media.style.getPropertyValue('--py')).toBe('');
    expect(setCalls[0]?.[1]).toEqual({ transformPerspective: 900, rotationX: 0, y: 0 });
    expect(setCalls[1]?.[1]).toEqual({ transformPerspective: 900, rotationX: 10, y: 24, transformOrigin: '50% 100%' });
    expect(toCalls).toHaveLength(1);
  });
});
