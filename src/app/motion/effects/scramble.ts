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

  /** Ends a running shuffle on the real word at once. */
  const settle = (link: HTMLElement): void => {
    const timer = timers.get(link);
    if (timer === undefined) return;
    clearTimeout(timer);
    timers.delete(link);
    const word = link.getAttribute('aria-label');
    if (word && link.firstChild instanceof Text) link.firstChild.data = word;
    link.style.width = '';
    link.style.overflow = '';
  };

  const play = (link: HTMLElement): void => {
    if (timers.has(link) || link.hasAttribute('data-settled')) return;
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
  // A page change is a view transition: the browser shows a still picture of the page and stops hit-testing, so a
  // shuffle or an underline caught half way froze there and started again when the pointer was found on the link
  // (issue #572). The click settles both before the picture is taken, and they stay settled until the pointer leaves.
  const onClick = (e: MouseEvent): void => {
    // detail 0 is a keyboard click: no pointer will leave to undo it, and the focus already stopped the shuffle
    if (e.detail === 0 || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (!(e.currentTarget instanceof HTMLElement)) return;
    settle(e.currentTarget);
    e.currentTarget.setAttribute('data-settled', '');
  };
  // while the transition runs the pointer is over its picture, not the link: that is not leaving. The pointer
  // usually leaves during it, and no pointerleave follows (issue #574), so any move off the link once the page is
  // live again ends the settled state (shortcut: a pointer that stops dead during the transition keeps the underline
  // until its next move, fine for a menu link)
  const onMove = (e: PointerEvent): void => {
    if (document.activeViewTransition) return;
    for (const link of links) {
      if (link.hasAttribute('data-settled') && !(e.target instanceof Node && link.contains(e.target))) {
        link.removeAttribute('data-settled');
      }
    }
  };
  document.addEventListener('pointermove', onMove, { passive: true });
  for (const link of links) {
    link.addEventListener('pointerenter', onEnter);
    link.addEventListener('focus', onEnter);
    link.addEventListener('click', onClick);
  }

  return () => {
    document.removeEventListener('pointermove', onMove);
    for (const link of links) {
      link.removeEventListener('pointerenter', onEnter);
      link.removeEventListener('focus', onEnter);
      link.removeEventListener('click', onClick);
      link.removeAttribute('data-settled');
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
