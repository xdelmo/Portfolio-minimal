import type { Page } from '@playwright/test';

/**
 * Counts the frames the hero pixel field draws (each starts with a clearRect on its canvas). Whether its loop runs is
 * what the pause and the field tests ask, and a count answers it at any frame rate: WebKit in CI's image draws this page
 * at about 4 frames a second, and a canvas compared pixel by pixel sometimes did not change within 5 s (issue #53).
 */
export async function countFieldDraws(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const w = window as unknown as { fieldDraws: number };
    w.fieldDraws = 0;
    const proto = CanvasRenderingContext2D.prototype;
    const clear = Object.getOwnPropertyDescriptor(proto, 'clearRect')?.value as (this: CanvasRenderingContext2D, ...rect: number[]) => void;
    proto.clearRect = function (x: number, y: number, width: number, height: number) {
      if (this.canvas.closest('app-pixel-field')) w.fieldDraws++;
      clear.call(this, x, y, width, height);
    };
  });
}

export const fieldDraws = (page: Page): Promise<number> =>
  page.evaluate(() => (window as unknown as { fieldDraws: number }).fieldDraws);

/** At 4 frames a second on a busy CI machine, a few frames can take seconds. */
export const DRAWS_MS = 15_000;
