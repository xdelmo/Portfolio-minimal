import { expect, test } from './fixtures';

const github = /^https:\/\/github\.com\/xdelmo\/[\w.-]+$/;

test('every project in the work list links to its code on GitHub', async ({ page }) => {
  await page.goto('/en/');
  const projects = page.locator('#work .project');
  const count = await projects.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    const repos = projects.nth(i).locator('.repos a');
    expect(await repos.count(), `project ${String(i)}`).toBeGreaterThan(0);
    for (const href of await repos.evaluateAll((links) => links.map((l) => (l as HTMLAnchorElement).href))) expect(href).toMatch(github);
  }
});

test('every side quest links to its repository', async ({ page }) => {
  await page.goto('/it/');
  const quests = page.locator('#side-quests li');
  await expect(quests).toHaveCount(3);
  for (const href of await page.locator('#side-quests li a').evaluateAll((links) => links.map((l) => (l as HTMLAnchorElement).href))) {
    expect(href).toMatch(github);
  }
  await expect(page.locator('#side-quests li a')).toHaveCount(3);
});

test('a case study leads with the code, the live demo comes after', async ({ page }) => {
  await page.goto('/en/work/apexflow');
  const first = page.locator('.links a').first();
  await expect(first).toHaveAttribute('href', github);
  await expect(first).toHaveClass(/button--primary/);
  await expect(page.locator('.links a').last()).toHaveText('Open the live demo');
});

test('every link to a repository carries the pixel GitHub mark, hidden from assistive tech', async ({ page }) => {
  for (const path of ['/en/', '/en/work/apexflow']) {
    await page.goto(path);
    const links = page.locator('a[href^="https://github.com/xdelmo/"]');
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const link = links.nth(i);
      await expect(link.locator('app-github-mark svg')).toHaveAttribute('aria-hidden', 'true');
      await expect(link).toHaveAccessibleName((await link.innerText()).trim());
    }
  }
  await page.goto('/en/');
  await expect(page.locator('#side-quests .repo-link').first()).toHaveAccessibleName('Code on GitHub');
});
