import type { Effect } from '../motion-host';

/**
 * The About's big numbers count up once as they come into view (issue #392): from 0 to the value, a million passing
 * through thousands (€0K … €999K, then €1M). The page is rendered with the real values; they drop to 0 only when the
 * row starts entering the screen, so a page that never scrolls there, a test or a reader keeps the real text.
 */
export const figuresEffect: Effect = (root, { gsap, ScrollTrigger }) => {
  const els = [...root.querySelectorAll<HTMLElement>('#about .figure-value')];
  if (!els.length) return undefined;
  const finals = els.map((el) => el.textContent);
  const trigger = ScrollTrigger.create({
    trigger: '#about .figures',
    start: 'top bottom',
    once: true,
    onEnter: () => {
      els.forEach((el, i) => {
        const [, pre = '', digits = '0', unit = ''] = /^(\D*)(\d+)(\D*)$/.exec(finals[i]) ?? [];
        const thousands = unit === 'M';
        const counter = { n: 0 };
        gsap.to(counter, {
          n: Number(digits) * (thousands ? 1000 : 1),
          duration: 1.4,
          delay: 0.1 * i,
          ease: 'power2.out',
          onUpdate: () => {
            const n = String(Math.round(counter.n));
            el.textContent = thousands ? `${pre}${n}K` : `${pre}${n}${unit}`;
          },
          onComplete: () => {
            el.textContent = finals[i];
          },
        });
      });
    },
  });
  return () => {
    trigger.kill();
    els.forEach((el, i) => (el.textContent = finals[i]));
  };
};
