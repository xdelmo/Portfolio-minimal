import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { withFontPreload } from './font-preload.mjs';
import { extractSeoLinks, robotsTxt, sitemapXml } from './seo-files.mjs';

const ROOT = 'dist/portfolio/browser';
const SITE_URL = 'https://www.emanueledelmonte.it';

async function htmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  return entries
    .filter((e) => e.isFile() && e.name === 'index.html')
    .map((e) => join(e.parentPath ?? e.path, e.name));
}

const pages = [];
for (const locale of ['en', 'it']) {
  // the latin subset covers every glyph of both languages
  const font = (await readdir(join(ROOT, locale, 'media'))).find((name) => /^instrument-sans-latin-wdth-normal-.*\.woff2$/.test(name));
  if (!font) throw new Error(`postbuild: latin font not found in ${locale}/media`);
  for (const file of await htmlFiles(join(ROOT, locale))) {
    const html = withFontPreload(await readFile(file, 'utf8'), `media/${font}`);
    await writeFile(file, html);
    const links = extractSeoLinks(html);
    if (links) pages.push(links);
  }
}
pages.sort((a, b) => a.canonical.localeCompare(b.canonical));

if (pages.length === 0) throw new Error('postbuild: no indexable pages found, is the build output where expected?');

await writeFile(join(ROOT, 'sitemap.xml'), sitemapXml(pages));
await writeFile(join(ROOT, 'robots.txt'), robotsTxt(SITE_URL));
console.log(`postbuild: sitemap.xml with ${pages.length} pages, robots.txt`);
