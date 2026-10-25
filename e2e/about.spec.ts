import { expect, test, type Page } from './fixtures';

const statement = (page: Page) => page.locator('#about .statement');
// how lit each word is (0 → 1); its colour follows in CSS
const lit = (page: Page) =>
  statement(page).evaluate((el) => [...el.querySelectorAll<HTMLElement>('.word')].map((w) => parseFloat(getComputedStyle(w).getPropertyValue('--lit') || '1')));

test('the About opens with a statement whose words light up as it scrolls by', async ({ page }) => {
  await page.goto('/en/');
  await expect(statement(page)).toHaveText('I care about the parts users never see but always feel.');
  await expect.poll(async () => (await lit(page)).length).toBeGreaterThan(5);
  expect((await lit(page)).some((v) => v < 1)).toBe(true);
  await statement(page).evaluate((el) => {
    window.scrollTo(0, el.getBoundingClientRect().bottom + scrollY - innerHeight * 0.2);
  });
  await expect.poll(async () => (await lit(page)).every((v) => v === 1)).toBe(true);
});

test('"At a glance" sits on the band, not on a white card', async ({ page }) => {
  await page.goto('/en/');
  expect(await page.locator('app-at-a-glance .glance').evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('the statement is plain text in full colour', async ({ page }) => {
    await page.goto('/it/');
    await page.waitForTimeout(500);
    await expect(statement(page)).toHaveText('Curo le parti che nessuno vede ma tutti sentono.');
    expect(await lit(page)).toHaveLength(0);
  });
});

for (const [lang, sentence, daily] of [
  ['en', 'Claude Code is part of my day', 'Every day'],
  ['it', 'Claude Code fa parte della mia giornata', 'Ogni giorno'],
] as const) {
  test(`${lang}: how I use AI is said once, with the proof, and Claude Code is an everyday tool`, async ({ page }) => {
    await page.goto(`/${lang}/`);
    await expect(page.locator('#about')).toContainText(sentence);
    await expect(page.locator('#about')).toContainText('MCP');
    const everyDay = page.locator('#stack .level').filter({ has: page.getByRole('heading', { name: daily }) });
    await expect(everyDay.getByText('Claude Code', { exact: true })).toHaveCount(1);
    const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(ld.join()).toContain('Model Context Protocol');
  });
}
