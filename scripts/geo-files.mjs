// Markdown versions of every page plus llms.txt and llms-full.txt (spec §9), built from the same content files as the site.
const SITE_URL = 'https://www.emanueledelmonte.it';
// the same words as the page headings (messages.it.xlf)
const LABELS = {
  en: { work: 'Selected work', quests: 'Side quests', about: 'About', experience: 'Experience', stack: 'Tools I use', contact: 'Get in touch', context: 'Context', architecture: 'How it is built', decisions: 'Key decisions', outcome: 'Outcome', links: 'Links' },
  it: { work: 'Progetti selezionati', quests: 'Side quest', about: 'Chi sono', experience: 'Esperienza', stack: 'Strumenti che uso', contact: 'Contatti', context: 'Contesto', architecture: 'Come è costruito', decisions: 'Scelte chiave', outcome: 'Risultato', links: 'Link' },
};
const url = (locale, path = '') => `${SITE_URL}/${locale}/${path}`;
const list = (items, line) => items.map(line).join('\n');

export function homeMarkdown(c, locale) {
  const l = LABELS[locale];
  return `${[
    `# ${c.person.name} — ${c.person.role}`,
    c.hero.headline,
    `${c.hero.lede} ${c.person.availability}`,
    list(c.glance, (g) => `- ${g.label}: ${g.value}`),
    `## ${l.work}`,
    list(c.projects, (p) => `- [${p.title}](${url(locale, `work/${p.slug}`)}): ${p.summary}`),
    `## ${l.quests}`,
    list(c.sideQuests, (q) => `- [${q.title}](${q.repo}): ${q.summary}`),
    `## ${l.about}`,
    c.aboutStatement,
    c.about,
    `## ${l.experience}`,
    // newest first here: the page tells the story oldest first, a reader who skims wants the current job
    list([...c.experience].reverse(), (e) => `- ${e.period} — ${e.title}, ${e.org}: ${[e.summary, ...e.highlights].join(' ')}`),
    list(c.studies, (s) => `- ${s.period} — ${s.title}, ${s.org}: ${s.summary}`),
    `## ${l.stack}`,
    list(c.stack, (g) => `- ${g.name}: ${g.items.join(', ')}`),
    `## ${l.contact}`,
    [`Email: ${c.person.email}`, `LinkedIn: ${c.person.linkedin}`, `GitHub: ${c.person.github}`].join('\n'),
  ].join('\n\n')}\n`;
}

export function projectMarkdown(p, c, locale) {
  const l = LABELS[locale];
  return `${[
    `# ${p.title}`,
    p.summary,
    `Stack: ${p.stack.join(', ')}`,
    `## ${l.links}`,
    [...(p.demoUrl ? [`- Demo: ${p.demoUrl}`] : []), ...p.repos.map((r) => `- [${r.label}](${r.url})`)].join('\n'),
    `## ${l.context}`,
    p.caseStudy.context,
    `## ${l.architecture}`,
    list(p.caseStudy.architecture, (a) => `- ${a}`),
    `## ${l.decisions}`,
    p.caseStudy.decisions.map((d) => `### ${d.title}\n\n${d.body}`).join('\n\n'),
    `## ${l.outcome}`,
    p.caseStudy.outcome,
    `${c.person.name}, ${c.person.role}: ${url(locale)}`,
  ].join('\n\n')}\n`;
}

export function llmsTxt(contents) {
  const { en } = contents;
  const sections = Object.entries(contents).map(([locale, c]) =>
    [
      `## ${locale === 'it' ? 'Italiano' : 'English'}`,
      '',
      `- [${c.person.name} — ${c.person.role}](${url(locale, 'index.md')}): ${c.hero.headline}`,
      ...c.projects.map((p) => `- [${p.title}](${url(locale, `work/${p.slug}.md`)}): ${p.summary}`),
    ].join('\n'),
  );
  return `${[`# ${en.person.name}`, `> ${en.person.summary} ${en.person.availability}`, ...sections].join('\n\n')}\n`;
}

export function geoFiles(contents) {
  const pages = Object.entries(contents).flatMap(([locale, c]) => [
    { path: `${locale}/index.md`, body: homeMarkdown(c, locale) },
    ...c.projects.map((p) => ({ path: `${locale}/work/${p.slug}.md`, body: projectMarkdown(p, c, locale) })),
  ]);
  return [...pages, { path: 'llms.txt', body: llmsTxt(contents) }, { path: 'llms-full.txt', body: pages.map((p) => p.body).join('\n---\n\n') }];
}
