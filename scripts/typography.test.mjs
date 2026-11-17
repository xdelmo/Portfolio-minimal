// Visible copy uses typographic punctuation: ’ and “…”, never ASCII quotes between letters (issue #583)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';


/** Prose lines of a Markdown post: code blocks dropped, code spans blanked. */
export function proseLines(markdown) {
  let fence = false;
  return markdown.split('\n').flatMap((line, i) => {
    if (line.startsWith('```')) fence = !fence;
    return fence || line.startsWith('```') ? [] : [[i + 1, line.replace(/`[^`]*`/g, '')]];
  });
}

const offenders = (file, lines) =>
  lines.filter(([, line]) => /(?<=[A-Za-zÀ-ÿ])'(?=[A-Za-zÀ-ÿ])/.test(line)).map(([n]) => `${file}:${String(n)}`);

test('proseLines skips code', () => {
  assert.deepEqual(proseLines("a `it's`\n```\nx = 'y'\n```\nb"), [[1, 'a '], [5, 'b']]);
});

test('no straight apostrophes in visible copy', () => {
  const found = [];
  for (const file of ['src/app/content/content.en.ts', 'src/app/content/content.it.ts']) {
    const lines = readFileSync(file, 'utf8').split('\n').map((line, i) => [i + 1, line]);
    found.push(...offenders(file, lines.filter(([, l]) => !/^\s*(\/\/|\*|\/\*|import )/.test(l))));
  }
  const xlf = 'src/locale/messages.it.xlf';
  const units = readFileSync(xlf, 'utf8').split('\n').map((line, i) => [i + 1, (line.match(/<(?:source|target)>.*?<\/(?:source|target)>/g) ?? []).join(' ')]);
  found.push(...offenders(xlf, units));
  for (const slug of readdirSync('src/app/content/blog')) {
    for (const lang of ['en', 'it']) {
      const file = `src/app/content/blog/${slug}/${lang}.md`;
      found.push(...offenders(file, proseLines(readFileSync(file, 'utf8'))));
    }
  }
  assert.deepEqual(found, [], 'use ’ instead of \'');
});
