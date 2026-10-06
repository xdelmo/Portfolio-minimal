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

/** When the CSS fallback in site-intro.ts has lifted the panel (3s delay + 0.6s), in ms from navigation. */
export const INTRO_CSS_END_MS = 3600;

/** Whether a timeline of `duration` seconds started at `now` (ms from navigation) ends before the CSS fallback would. */
export function introFits(now: number, duration: number): boolean {
  return now + duration * 1000 <= INTRO_CSS_END_MS;
}
