const VECTORS: readonly (readonly [number, number])[] = [
  [-24, -24],
  [-16, -32],
  [0, -24],
  [16, -32],
  [24, -24],
  [8, -16],
];

/**
 * Spawns six 8px pastel pixels from the centre of `button`, jumping outward in three steps and cleaning up once done.
 * Skipped under reduced motion or forced colours.
 */
export function burstPixels(button: HTMLElement): void {
  if (
    typeof matchMedia === 'function' &&
    (!matchMedia('(prefers-reduced-motion: no-preference)').matches || matchMedia('(forced-colors: active)').matches)
  ) {
    return;
  }
  const host = button.parentElement;
  if (!host) return;

  const cx = button.offsetLeft + button.offsetWidth / 2 - 4;
  const cy = button.offsetTop + button.offsetHeight / 2 - 4;

  VECTORS.forEach(([dx, dy], i) => {
    const pixel = document.createElement('span');
    pixel.className = 'pixel-burst';
    pixel.setAttribute('aria-hidden', 'true');
    pixel.style.left = `${String(cx)}px`;
    pixel.style.top = `${String(cy)}px`;
    pixel.style.background = `var(--px-${String(i + 1)})`;
    host.append(pixel);

    if (typeof pixel.animate === 'function') {
      const anim = pixel.animate(
        [
          { transform: 'translate(0, 0)', opacity: 1 },
          { transform: `translate(${String(dx)}px, ${String(dy)}px)`, opacity: 0 },
        ],
        { duration: 220, easing: 'steps(3, end)', fill: 'forwards' },
      );
      anim.addEventListener('finish', () => {
        pixel.remove();
      });
    }
    setTimeout(() => {
      pixel.remove();
    }, 260);
  });
}
