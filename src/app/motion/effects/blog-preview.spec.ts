import type { Motion } from '../motion-host';
import { blogPreviewEffect } from './blog-preview';

function fakeMotion(desktop: boolean) {
  const values = new Map<HTMLElement, Record<string, number>>();
  const killTweensOf = vi.fn();
  const gsap = {
    quickTo: (el: HTMLElement, prop: string) => {
      return (val: number) => {
        const current = values.get(el) ?? {};
        current[prop] = val;
        values.set(el, current);
      };
    },
    killTweensOf,
  };
  return {
    motion: { gsap, ScrollTrigger: {}, SplitText: {}, desktop } as unknown as Motion,
    values,
    killTweensOf,
  };
}

describe('blogPreviewEffect', () => {
  function setupDOM() {
    const root = document.createElement('div');
    const list = document.createElement('ol');
    list.className = 'posts';
    const item = document.createElement('li');
    item.className = 'post-item';
    item.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 100, right: 200, bottom: 100, x: 0, y: 0, toJSON: () => ({}) });
    const preview = document.createElement('div');
    preview.className = 'post-preview';
    item.append(preview);
    list.append(item);
    root.append(list);
    return { root, item, preview };
  }

  it('tracks mouse pointer inside the row and resets on leave and cleanup', () => {
    const { root, item, preview } = setupDOM();
    const { motion, values, killTweensOf } = fakeMotion(true);
    const cleanup = blogPreviewEffect(root, motion);

    item.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'mouse', clientX: 200, clientY: 100 }));
    expect(values.get(preview)).toEqual({ '--px': 12, '--py': 16 });

    item.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'touch', clientX: 0, clientY: 0 }));
    expect(values.get(preview)).toEqual({ '--px': 12, '--py': 16 });

    item.dispatchEvent(new PointerEvent('pointerleave'));
    expect(values.get(preview)).toEqual({ '--px': 0, '--py': 0 });

    preview.style.setProperty('--px', '5px');
    preview.style.setProperty('--py', '5px');
    cleanup?.();
    expect(killTweensOf).toHaveBeenCalledWith(preview, '--px,--py');
    expect(preview.style.getPropertyValue('--px')).toBe('');
    expect(preview.style.getPropertyValue('--py')).toBe('');
  });

  it('clears inline offsets and skips listeners when not desktop', () => {
    const { root, preview } = setupDOM();
    preview.style.setProperty('--px', '8');
    preview.style.setProperty('--py', '8');
    const { motion } = fakeMotion(false);
    const cleanup = blogPreviewEffect(root, motion);
    expect(cleanup).toBeUndefined();
    expect(preview.style.getPropertyValue('--px')).toBe('');
    expect(preview.style.getPropertyValue('--py')).toBe('');
  });
});
