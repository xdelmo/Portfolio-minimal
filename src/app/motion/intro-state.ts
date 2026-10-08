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

/** How long the CSS fallback in site-intro.ts takes to lift the panel from when it starts (3s delay + 0.6s), in ms. */
export const INTRO_CSS_MS = 3600;

/**
 * Whether a timeline of `duration` seconds started at `now` ends before the CSS fallback, which started at `cssStart`
 * (both in ms on the page's clock), would have lifted the panel.
 */
export function introFits(now: number, duration: number, cssStart: number): boolean {
  return now + duration * 1000 <= cssStart + INTRO_CSS_MS;
}
