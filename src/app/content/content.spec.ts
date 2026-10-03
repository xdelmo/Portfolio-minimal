import { CONTENT_EN } from './content.en';
import { CONTENT_IT } from './content.it';

describe('content', () => {
  it('has the same projects, in the same order, in both languages', () => {
    expect(CONTENT_IT.projects.map((p) => p.slug)).toEqual(CONTENT_EN.projects.map((p) => p.slug));
  });

  it('uses url-safe slugs', () => {
    for (const p of CONTENT_EN.projects) expect(p.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('translates every summary', () => {
    CONTENT_EN.projects.forEach((p, i) => {
      expect(CONTENT_IT.projects[i].summary).not.toBe(p.summary);
    });
  });
});
