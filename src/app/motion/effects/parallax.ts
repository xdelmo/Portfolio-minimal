import type { Effect } from '../motion-host';
import { smoother } from '../smoother';

/**
 * Layers under smooth scroll (desktop, issue #160): each project picture scrolls a little slower than the page inside
 * its frame, as if further away (the frame stays put, so the picture never slides over the title under it, issue #408), the side quest slots trail behind it like floating items, and the contact photo follows a beat late.
 * Text never moves. Each element sits where the layout puts it when it is centred in the screen.
 */
export const parallaxEffect: Effect = (root, { desktop }) => {
  const smooth = smoother();
  if (!desktop || !smooth) return undefined;
  const triggers = [
    ...smooth.effects(root.querySelectorAll('#work .media > .shot, #work .media > .item'), { speed: 0.95 }),
    ...[...root.querySelectorAll('#side-quests .slot')].flatMap((slot, i) => smooth.effects(slot, { lag: 0.08 * ((i % 3) + 1) })),
    ...smooth.effects(root.querySelectorAll('.contact-photo'), { lag: 0.2 }),
  ];
  return () => {
    triggers.forEach((t) => {
      t.kill();
    });
  };
};
