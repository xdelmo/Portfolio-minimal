/** Runs `then` once the intro overlay has gone, or right away when there is none. Returns a cancel function. */
export function afterIntro(then: () => void): () => void {
  const html = document.documentElement;
  if (!html.classList.contains('intro-on')) {
    then();
    return () => undefined;
  }
  document.addEventListener('intro:done', then, { once: true });
  return () => {
    document.removeEventListener('intro:done', then);
  };
}

export function endIntro(): void {
  document.documentElement.classList.remove('intro-on');
  document.dispatchEvent(new CustomEvent('intro:done'));
}

/**
 * Whether a timeline of `duration` seconds started at `now` ends before the CSS fallback, which started at `cssStart`
 * and lifts the panel `cssMs` later (all in ms on the page's clock; site-intro.ts: 3.6s on desktop, 2s on phones).
 */
export function introFits(now: number, duration: number, cssStart: number, cssMs: number): boolean {
  return now + duration * 1000 <= cssStart + cssMs;
}
