import { expect, type Locator, type Page } from '@playwright/test';
import { CONTENT_EN } from '../src/app/content/content.en';

/** The projects as the site lists them (issue #115): a new one is checked by every page, axe and link test at once. */
export const PROJECTS = CONTENT_EN.projects;
export const SLUGS = PROJECTS.map((p) => p.slug);
/** Every case study in both languages. */
export const CASE_STUDIES = SLUGS.flatMap((s) => [`/en/work/${s}`, `/it/work/${s}`]);

/**
 * Presses a header control (pause, theme): in the header on desktop; on phones it lives in the menu panel (issue #193),
 * opened for the press and closed again after, so the page is uncovered as before.
 */
export async function press(page: Page, name: string | RegExp): Promise<void> {
  const inBar = page.locator('app-site-header .controls > :not(.menu)').getByRole('button', { name });
  if (await inBar.isVisible()) {
    await inBar.click();
    return;
  }
  await page.locator('.site-menu summary').click();
  await page.locator('.site-menu .settings').getByRole('button', { name }).click();
  await page.keyboard.press('Escape');
  await expect(page.locator('.site-menu .panel')).toBeHidden();
}

/** Opens what holds the language links: the header's dropdown on desktop, the menu panel on phones (issue #193). */
export async function openLanguages(page: Page): Promise<Locator> {
  const dropdown = page.locator('.language-menu summary');
  if (await dropdown.isVisible()) {
    await dropdown.click();
    return page.locator('.language-menu');
  }
  await page.locator('.site-menu summary').click();
  return page.locator('.site-menu .languages');
}
