import type { Effect } from '../motion-host';

const GLYPHS = 'abcdefghijklmnopqrstuvwxyz';
const STEPS = 8;
const STEP_MS = 45;

/**
 * Menu links shuffle their letters for a moment on hover or focus, then settle on the real word. The link keeps
 * an aria-label with the real word, so its accessible name never changes; its width is held so nothing shifts.
 */
export const scrambleEffect: Effect = (root, { desktop }) => {
  if (!desktop) return undefined;
  const links = [...document.querySelectorAll<HTMLAnchorElement>('app-site-header nav a')];
  const timers = new Map<HTMLElement, number>();

  const play = (link: HTMLElement): void => {
    if (timers.has(link)) return;
    // the letters change inside the link's one text node, never a new one: a click pressed on the old node and
    // released on a new one has no target in WebKit, and Safari dropped it
    const text = link.firstChild;
    if (!(text instanceof Text) || link.childNodes.length !== 1) return;
    const word = link.getAttribute('aria-label') ?? text.data.trim();
    link.setAttribute('aria-label', word);
    link.style.width = `${String(link.getBoundingClientRect().width)}px`;
    // wider random letters stay inside the held width instead of pushing on the next item
    link.style.overflow = 'clip';
    let step = 0;
    const tick = (): void => {
      step++;
      if (step >= STEPS) {
        text.data = word;
        link.style.width = '';
        link.style.overflow = '';
        timers.delete(link);
        return;
      }
      // letters settle from the left as the steps go by
      const settled = Math.floor((word.length * step) / STEPS);
      text.data = Array.from(word, (c, i) => (i < settled || c === ' ' ? c : GLYPHS[Math.floor(Math.random() * GLYPHS.length)])).join('');
      timers.set(link, window.setTimeout(tick, STEP_MS));
    };
    tick();
  };
  const onEnter = (e: Event): void => {
    if (e.currentTarget instanceof HTMLElement) play(e.currentTarget);
  };
  for (const link of links) {
    link.addEventListener('pointerenter', onEnter);
    link.addEventListener('focus', onEnter);
  }

  return () => {
    for (const link of links) {
      link.removeEventListener('pointerenter', onEnter);
      link.removeEventListener('focus', onEnter);
      const word = link.getAttribute('aria-label');
      const timer = timers.get(link);
      if (timer) clearTimeout(timer);
      if (word) link.textContent = word;
      link.style.width = '';
      link.style.overflow = '';
    }
    timers.clear();
  };
};
