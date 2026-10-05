import type { Effect } from '../motion-host';

/**
 * The pixel thread grows with the scroll through the sections after the hero, and lights the node of each section
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

  let tops: number[] = [];
  const place = (): void => {
    const base = trail.getBoundingClientRect().top;
    tops = titles.map((title, i) => {
      const box = title.getBoundingClientRect();
      const top = box.top - base + box.height / 2 - 6;
      nodes[i].style.top = `${String(top)}px`;
      return top;
    });
  };
  const light = (progress: number): void => {
    thread.style.setProperty('--thread', String(progress));
    const tip = progress * trail.offsetHeight;
    nodes.forEach((node, i) => node.classList.toggle('is-lit', tip >= tops[i]));
  };

  place();
  thread.classList.add('is-on');
  const trigger = ScrollTrigger.create({
    trigger: trail,
    start: 'top 60%',
    end: 'bottom bottom',
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
  };
};
