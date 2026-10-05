import assert from 'node:assert/strict';
import { test } from 'node:test';
import { geoFiles, homeMarkdown, llmsTxt, projectMarkdown } from './geo-files.mjs';

const project = {
  slug: 'demo',
  title: 'Demo',
  summary: 'A demo project.',
  stack: ['Angular', 'RxJS'],
  repos: [{ label: 'Code', url: 'https://github.com/x/demo' }],
  demoUrl: 'https://demo.example',
  caseStudy: { context: 'Why.', architecture: ['One', 'Two'], decisions: [{ title: 'Pick A', body: 'Because.' }], outcome: 'Done.' },
};
const content = {
  person: { name: 'Ada', role: 'Frontend Engineer', location: 'Latina, Italy', availability: 'Open from March.', email: 'a@x.it', linkedin: 'https://li/ada', github: 'https://gh/ada', summary: 'Ada builds Angular front ends.' },
  hero: { headline: 'Headline.', lede: 'Lede.' },
  aboutStatement: 'I care.',
  about: 'About.',
  glance: [{ label: 'Role', value: 'FE' }],
  projects: [project],
  experience: [{ period: '2026', title: 'Engineer', org: 'IPS', summary: 'Work.' }],
  sideQuests: [{ title: 'Quest', summary: 'Fun.', tags: ['WP'], repo: 'https://github.com/x/quest' }],
  stack: [{ name: 'Front end', items: ['Angular'] }],
};

test('home markdown starts with the person and lists every section as plain text', () => {
  const md = homeMarkdown(content, 'en');
  assert.match(md, /^# Ada — Frontend Engineer\n\nHeadline\.\n\nLede\. Open from March\./);
  for (const part of ['- Role: FE', '- [Demo](https://www.emanueledelmonte.it/en/work/demo): A demo project.', '- 2026 — Engineer, IPS: Work.', '- Front end: Angular', 'Email: a@x.it', '- [Quest](https://github.com/x/quest): Fun.', 'I care.\n\nAbout.']) {
    assert.ok(md.includes(part), part);
  }
  // the CV is not online (sensitive data), and the site no longer mentions it
  assert.ok(!md.includes('CV'));
});

test('project markdown has the case-study sections in the page language', () => {
  const md = projectMarkdown(project, content, 'it');
  assert.match(md, /^# Demo\n\nA demo project\.\n\nStack: Angular, RxJS/);
  for (const part of ['## Contesto', '- One', '### Pick A', '## Risultato', '- [Code](https://github.com/x/demo)', 'Demo: https://demo.example']) {
    assert.ok(md.includes(part), part);
  }
});

test('llms.txt links every markdown page of both languages', () => {
  const txt = llmsTxt({ en: content, it: content });
  assert.match(txt, /^# Ada\n\n> Ada builds Angular front ends\. Open from March\.\n/);
  for (const url of ['/en/index.md', '/it/index.md', '/en/work/demo.md', '/it/work/demo.md']) {
    assert.ok(txt.includes(`https://www.emanueledelmonte.it${url}`), url);
  }
});

test('geoFiles writes one file per page plus llms.txt and llms-full.txt', () => {
  const paths = geoFiles({ en: content, it: content }).map((f) => f.path).sort();
  assert.deepEqual(paths, ['en/index.md', 'en/work/demo.md', 'it/index.md', 'it/work/demo.md', 'llms-full.txt', 'llms.txt']);
});
