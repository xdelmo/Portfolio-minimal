import { CONTENT_EN } from './content.en';
import { CONTENT_IT } from './content.it';

describe('content', () => {
  it('opens the About with one statement in each language, not repeated in the paragraph', () => {
    for (const c of [CONTENT_EN, CONTENT_IT]) {
      expect(c.aboutStatement.length).toBeGreaterThan(20);
      expect(c.about).not.toContain(c.aboutStatement.replace(/\.$/, ''));
    }
    expect(CONTENT_IT.aboutStatement).not.toBe(CONTENT_EN.aboutStatement);
  });

  it('writes the About paragraph in the first person, like the rest of the site', () => {
    expect(CONTENT_EN.about).toMatch(/^I'm Emanuele Del Monte/);
    expect(CONTENT_EN.about).not.toMatch(/Emanuele Del Monte is /);
    expect(CONTENT_IT.about).toMatch(/^Sono Emanuele Del Monte/);
    expect(CONTENT_IT.about).not.toMatch(/Emanuele Del Monte è /);
  });

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

  it('gives every project a case study with the same shape in both languages', () => {
    CONTENT_EN.projects.forEach((en, i) => {
      const it = CONTENT_IT.projects[i];
      expect(en.caseStudy.architecture.length).toBeGreaterThan(0);
      expect(en.caseStudy.decisions.length).toBeGreaterThan(0);
      expect(it.caseStudy.architecture.length).toBe(en.caseStudy.architecture.length);
      expect(it.caseStudy.decisions.length).toBe(en.caseStudy.decisions.length);
      expect(it.caseStudy.context).not.toBe(en.caseStudy.context);
      expect(it.repos.map((r) => r.url)).toEqual(en.repos.map((r) => r.url));
      it.repos.forEach((repo, j) => {
        expect(repo.label).not.toBe(en.repos[j].label);
      });
      expect(it.caseStudy.outcome).not.toBe(en.caseStudy.outcome);
      const texts = [
        it.caseStudy.context,
        it.caseStudy.outcome,
        ...it.caseStudy.architecture,
        ...it.caseStudy.decisions.flatMap((d) => [d.title, d.body]),
      ];
      for (const text of texts) expect(text.trim()).not.toBe('');
    });
  });

  it('keeps images identical across languages and describes them in each', () => {
    CONTENT_EN.projects.forEach((en, i) => {
      const it = CONTENT_IT.projects[i];
      expect(it.image?.src).toBe(en.image?.src);
      if (en.image && it.image) expect(it.image.alt).not.toBe(en.image.alt);
    });
  });

  it('has the same number of experience, side quest, stack and glance entries', () => {
    expect(CONTENT_IT.experience.length).toBe(CONTENT_EN.experience.length);
    expect(CONTENT_IT.sideQuests.length).toBe(CONTENT_EN.sideQuests.length);
    expect(CONTENT_IT.stack.map((g) => g.items)).toEqual(CONTENT_EN.stack.map((g) => g.items));
    expect(CONTENT_IT.glance.length).toBe(CONTENT_EN.glance.length);
  });
});
