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
