import type { ScrollTrigger as Trigger } from 'gsap/ScrollTrigger';
import type { Effect } from '../motion-host';

/**
 * The pixel thread grows with the scroll through the sections between the hero and the contact finale, and lights the node of each section
 * once it reaches that section's title. Nodes are placed again whenever ScrollTrigger refreshes (pins, resizes).
 */
export const threadEffect: Effect = (root, { ScrollTrigger }) => {
  const trail = root.querySelector<HTMLElement>('.trail');
  const thread = trail?.querySelector<HTMLElement>('app-thread .thread');
  if (!trail || !thread) return undefined;
  const titles = [...trail.querySelectorAll<HTMLElement>('section[id]')].flatMap((s) => s.querySelector<HTMLElement>('h2') ?? []);
  const nodes = titles.map(() => {
    const node = document.createElement('i');
    node.className = 'node';
    thread.append(node);
    return node;
  });

  // a pinned section (the experience deck) stands still while the page scrolls through its pin spacer: its node and
  // the dashes follow the scroll the pin uses up, or they would run away from a title that does not move
  // `pin` is set at runtime on pinning triggers but missing from GSAP's types
  type Pin = Trigger & { pin?: Element };
  const pinsIn = (): Pin[] => (ScrollTrigger.getAll() as Pin[]).filter((t) => t.pin && trail.contains(t.pin));
  const used = (pin: Pin): number => Math.min(Math.max(scrollY - pin.start, 0), pin.end - pin.start);

  let tops: number[] = [];
  let pinOf: (Pin | undefined)[] = [];
  const place = (): void => {
    const base = trail.getBoundingClientRect().top;
    const pins = pinsIn();
    pinOf = titles.map((title) => pins.find((pin) => pin.pin?.contains(title)));
    tops = titles.map((title, i) => {
      const box = title.getBoundingClientRect();
      const pin = pinOf[i]?.pin;
      // inside a pin: where the title is when the pin starts, at the top of its spacer
      const top = pin?.parentElement
        ? pin.parentElement.getBoundingClientRect().top - base + box.top - pin.getBoundingClientRect().top
        : box.top - base;
      return top + box.height / 2 - 6;
    });
  };
  const light = (progress: number): void => {
    thread.style.setProperty('--thread', String(progress));
    thread.style.backgroundPositionY = `${String(pinsIn().reduce((sum, pin) => sum + used(pin), 0))}px`;
    const tip = progress * trail.offsetHeight;
    nodes.forEach((node, i) => {
      const pin = pinOf[i];
      const top = tops[i] + (pin ? used(pin) : 0);
      node.style.top = `${String(top)}px`;
      node.classList.toggle('is-lit', tip >= top);
    });
  };

  place();
  thread.classList.add('is-on');
  const trigger = ScrollTrigger.create({
    trigger: trail,
    start: 'top 60%',
    // drawn to the end once the last stop reaches the same line, just as the contact band arrives
    end: 'bottom 60%',
    onUpdate: (self) => {
      light(self.progress);
    },
    onRefresh: (self) => {
      place();
      light(self.progress);
    },
  });
  light(trigger.progress);

  return () => {
    trigger.kill();
    for (const node of nodes) node.remove();
    thread.classList.remove('is-on');
    thread.style.removeProperty('--thread');
    thread.style.removeProperty('background-position-y');
  };
};
