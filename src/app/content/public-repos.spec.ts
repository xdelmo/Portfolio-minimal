import { CONTENT_EN } from './content.en';
import { onlyPublic } from './public-repos';

describe('onlyPublic', () => {
  const isPublic = (url: string) => url.endsWith('/mcp-server') || url.endsWith('/backend-tesi');

  it('keeps only the links to public repositories, and the projects and side quests themselves', () => {
    const c = onlyPublic(CONTENT_EN, isPublic);
    expect(c.projects).toHaveLength(CONTENT_EN.projects.length);
    expect(c.sideQuests).toHaveLength(CONTENT_EN.sideQuests.length);
    const urls = [...c.projects.flatMap((p) => p.repos.map((r) => r.url)), ...c.sideQuests.flatMap((q) => (q.repo ? [q.repo] : []))];
    expect(urls.length).toBeGreaterThan(0);
    expect(urls.every(isPublic)).toBe(true);
  });

  it('leaves a project with no public code an empty list, and a side quest without its repo', () => {
    const c = onlyPublic(CONTENT_EN, () => false);
    expect(c.projects.every((p) => p.repos.length === 0)).toBe(true);
    expect(c.sideQuests.every((q) => !('repo' in q))).toBe(true);
  });

  it('changes nothing when every repository is public', () => {
    expect(onlyPublic(CONTENT_EN, () => true)).toEqual(CONTENT_EN);
  });
});
