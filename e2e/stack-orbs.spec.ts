import { expect, test } from './fixtures';

// a word wider than the orb's inner box overflows to the right only, and the label drifts off centre
for (const width of [320, 390, 1280]) {
  test(`at ${String(width)}px every orb label sits in the middle of its orb (Italian, the longer words)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/it/');
    const offsets = await page.locator('#stack .orb').evaluateAll((orbs) =>
      orbs.map((orb) => {
        const box = orb.getBoundingClientRect();
        const range = document.createRange();
        range.selectNodeContents(orb);
        const text = range.getBoundingClientRect();
        return Math.abs(text.left + text.width / 2 - (box.left + box.width / 2));
      }),
    );
    expect(offsets).toHaveLength(4);
    for (const offset of offsets) expect(offset).toBeLessThanOrEqual(1);
  });
}
