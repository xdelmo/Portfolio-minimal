import { ARROW_CELLS, arrowCells, pointing } from '../arrow';
import type { Effect } from '../motion-host';

const INTERACTIVE = 'a, button, summary, [role="button"]';
const MAGNET = 8; // px an element can lean towards the pointer
// the contact title is a link already, and the biggest words on the page: no arrow needed to find it
const TITLES = 'main h2:not(#contact-title)';
const CELL = 8;
// the eight directions a line stays clean on a 7-cell grid (in between, the arrow smudges into a blob)
const STEPS = 8;

/**
 * Desktop: a pixel trails the pointer and opens into a frame over links and buttons; elements marked
 * `data-magnetic` lean a few pixels towards it. Near a section title the pixel becomes an arrow pointing at the
 * title's centre. One delegated listener, so every route is covered.
 */
export const cursorEffect: Effect = (root, { gsap, desktop }) => {
  const dot = root.querySelector<HTMLElement>('.pixel-cursor');
  const arrow = root.querySelector<HTMLCanvasElement>('.pixel-arrow');
  const pen = arrow?.getContext('2d');
  if (!desktop || !dot || !arrow || !pen) return undefined;

  const toX = gsap.quickTo([dot, arrow], 'x', { duration: 0.15, ease: 'power3.out' });
  const toY = gsap.quickTo([dot, arrow], 'y', { duration: 0.15, ease: 'power3.out' });
  let drawn = '';
  // the step and the colour (the theme can change between two moves) decide whether to redraw
  const point = (angle: number | null): void => {
    arrow.style.display = angle === null ? 'none' : 'block';
    dot.style.visibility = angle === null ? '' : 'hidden';
    if (angle === null) return;
    const step = Math.round((angle / (Math.PI * 2)) * STEPS);
    const color = getComputedStyle(dot).backgroundColor; // the pixel's --accent, never framed while the arrow shows
    const key = `${String(step)} ${color}`;
    if (key === drawn) return;
    drawn = key;
    pen.clearRect(0, 0, ARROW_CELLS * CELL, ARROW_CELLS * CELL);
    pen.fillStyle = color;
    for (const [c, r] of arrowCells((step / STEPS) * Math.PI * 2)) pen.fillRect(c * CELL, r * CELL, CELL, CELL);
    arrow.dataset['angle'] = String(Math.round((step / STEPS) * 360)); // degrees, for the e2e
  };
  // titles (and the lines SplitText wraps them in) are full-width blocks: the arrow aims at the words themselves
  const range = document.createRange();
  const textBox = (title: Element): { left: number; top: number; right: number; bottom: number } => {
    const box = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity };
    const words = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
    for (let node = words.nextNode(); node; node = words.nextNode()) {
      range.selectNodeContents(node);
      const r = range.getBoundingClientRect();
      if (!r.width) continue;
      box.left = Math.min(box.left, r.left);
      box.top = Math.min(box.top, r.top);
      box.right = Math.max(box.right, r.right);
      box.bottom = Math.max(box.bottom, r.bottom);
    }
    return box;
  };
  const leaning = new Set<HTMLElement>();
  let shown = false;

  // CSS variables feed `translate` (see _base.scss), so hover transforms still apply on top
  const lean = (el: HTMLElement, x: number, y: number): void => {
    leaning.add(el);
    gsap.to(el, { '--mx': `${String(x)}px`, '--my': `${String(y)}px`, duration: 0.4, ease: 'power3.out', overwrite: 'auto' });
  };
  let magnet: HTMLElement | null = null;

  const onMove = (e: PointerEvent): void => {
    if (e.pointerType !== 'mouse') return;
    if (!shown) {
      gsap.set(dot, { display: 'block', x: e.clientX, y: e.clientY });
      gsap.set(arrow, { x: e.clientX, y: e.clientY });
      shown = true;
    }
    toX(e.clientX);
    toY(e.clientY);
    const target = e.target instanceof Element ? e.target : null;
    const over = !!target?.closest(INTERACTIVE);
    dot.classList.toggle('is-over', over);
    // links keep their frame; elsewhere the nearest title within reach turns the pixel into an arrow
    point(over ? null : pointing(e.clientX, e.clientY, [...document.querySelectorAll(TITLES)].map(textBox)));

    const next = target?.closest<HTMLElement>('[data-magnetic]') ?? null;
    if (magnet && magnet !== next) lean(magnet, 0, 0);
    magnet = next;
    if (magnet) {
      const box = magnet.getBoundingClientRect();
      const dx = (e.clientX - (box.left + box.width / 2)) / (box.width / 2);
      const dy = (e.clientY - (box.top + box.height / 2)) / (box.height / 2);
      lean(magnet, Math.max(-1, Math.min(1, dx)) * MAGNET, Math.max(-1, Math.min(1, dy)) * MAGNET * 0.6);
    }
  };
  const onLeave = (): void => {
    gsap.set([dot, arrow], { display: 'none' });
    shown = false;
  };
  addEventListener('pointermove', onMove, { passive: true });
  document.documentElement.addEventListener('pointerleave', onLeave);

  return () => {
    removeEventListener('pointermove', onMove);
    document.documentElement.removeEventListener('pointerleave', onLeave);
    gsap.set([dot, arrow], { clearProps: 'all' });
    dot.classList.remove('is-over');
    for (const el of leaning) gsap.set(el, { '--mx': '0px', '--my': '0px' });
  };
};
