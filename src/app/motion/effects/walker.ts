import type { ScrollTrigger as Trigger } from 'gsap/ScrollTrigger';
import type { Effect } from '../motion-host';
import { type Box, type WalkerGeometry, type WalkerPlace, walkerPlace } from './walker-path';

/** Without a scroll update for this long the avatar stops walking. */
const REST_MS = 200;

/**
 * The avatar (avatar/avatar-scene.ts) leaves the hero as the page scrolls: it shrinks onto the top of the pixel
 * thread, walks down it with the tip of the lit line (thread.ts), and on into the contact band. It walks while the
 * page scrolls, facing the viewer going down and turning its back going up, and stands looking at the section when the
 * scroll stops. The layer moves through CSS variables (translate and scale), so it never fights GSAP's transforms.
 */
export const walkerEffect: Effect = (root, { ScrollTrigger }) => {
  const layer = root.querySelector<HTMLElement>('.avatar');
  const slot = root.querySelector<HTMLElement>('.avatar-slot');
  const trail = root.querySelector<HTMLElement>('.trail');
  const thread = trail?.querySelector<HTMLElement>('app-thread .thread');
  const contact = root.querySelector<HTMLElement>('#contact');
  const base = layer?.offsetParent;
  if (!layer || !slot || !trail || !thread || !contact || !base) return undefined;

  let geo: WalkerGeometry | null = null;
  let where: WalkerPlace['where'] | null = null;
  const measure = (): void => {
    const origin = base.getBoundingClientRect();
    const box = (el: Element): Box => {
      const b = el.getBoundingClientRect();
      return { x: b.left - origin.left, y: b.top - origin.top, w: b.width, h: b.height };
    };
    const line = box(thread);
    const band = box(contact);
    const small = matchMedia('(min-width: 1024px)').matches ? 96 : 48;
    geo = {
      slot: box(slot),
      // on phones the thread runs 4px from the edge: keep the whole figure on screen
      threadX: Math.max(line.x + line.w / 2, small * 0.2),
      trailTop: line.y,
      trailBottom: line.y + line.h,
      end: band.y + band.h - 64,
      small,
    };
    where = null;
  };

  const triggers: Trigger[] = [];
  const place = (): void => {
    if (!geo) return;
    const [hero, trailT, contactT] = triggers.map((t) => t.progress);
    const p = walkerPlace({ hero, trail: trailT, contact: contactT }, geo);
    if (p.where !== where) {
      where = p.where;
      layer.dataset['place'] = where;
      layer.style.width = `${String(p.w)}px`;
      layer.style.height = `${String(p.h)}px`;
      if (layer.dataset['gait'] !== 'walk') layer.dataset['facing'] = where === 'hero' ? 'front' : 'right';
    }
    layer.style.setProperty('--avatar-x', `${String(p.x)}px`);
    layer.style.setProperty('--avatar-y', `${String(p.y)}px`);
    layer.style.setProperty('--avatar-scale', String(p.scale));
  };

  let rest = 0;
  const moved = (self: Trigger): void => {
    place();
    layer.dataset['gait'] = 'walk';
    layer.dataset['facing'] = self.direction > 0 ? 'down' : 'up';
    clearTimeout(rest);
    rest = window.setTimeout(() => {
      layer.dataset['gait'] = 'idle';
      // standing on the thread it looks at the section beside it
      layer.dataset['facing'] = where === 'hero' ? 'front' : 'right';
    }, REST_MS);
  };
  const refreshed = (): void => {
    measure();
    place();
  };

  // the still image hides once the 3D avatar stands on it, drawn (by the scene) and placed (here). An observer, not a
  // CSS :has(): Firefox does not restyle the slot when an attribute changes that deep
  const cover = (): void => {
    slot.classList.toggle('is-covered', layer.hasAttribute('data-place') && layer.hasAttribute('data-drawn'));
  };
  const covering = new MutationObserver(cover);
  covering.observe(layer, { attributes: true, attributeFilter: ['data-place', 'data-drawn'] });

  layer.dataset['gait'] = 'idle';
  measure();
  triggers.push(
    ScrollTrigger.create({ trigger: trail, start: 'top bottom', end: 'top 60%', onUpdate: moved }),
    // the same stretch as the thread's lit line, so the soles stay on its tip
    ScrollTrigger.create({ trigger: trail, start: 'top 60%', end: 'bottom 60%', onUpdate: moved }),
    // clamp(): the contact band is the last section, the page may end before its bottom reaches the screen's
    ScrollTrigger.create({ trigger: contact, start: 'top 60%', end: 'clamp(bottom bottom)', onUpdate: moved }),
  );
  place();
  // after every trigger has refreshed: the pins above have their spacers, the progress values are current
  ScrollTrigger.addEventListener('refresh', refreshed);

  return () => {
    ScrollTrigger.removeEventListener('refresh', refreshed);
    covering.disconnect();
    slot.classList.remove('is-covered');
    clearTimeout(rest);
    for (const t of triggers) t.kill();
    for (const key of ['place', 'gait', 'facing']) layer.removeAttribute(`data-${key}`);
    for (const prop of ['width', 'height', '--avatar-x', '--avatar-y', '--avatar-scale']) layer.style.removeProperty(prop);
  };
};
