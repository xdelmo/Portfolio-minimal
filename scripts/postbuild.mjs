import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { URL } from 'node:url';
import { gzipSync } from 'node:zlib';
import { CONTENT_EN } from '../src/app/content/content.en.ts';
import { CONTENT_IT } from '../src/app/content/content.it.ts';
import { PUBLIC_REPOS } from '../src/app/content/public-repos.generated.ts';
import { onlyPublic } from '../src/app/content/public-repos.ts';
import { withFontPreload } from './font-preload.mjs';
import { geoFiles } from './geo-files.mjs';
import { INITIAL_JS_BUDGET, initialScripts } from './js-budget.mjs';
import { contentSecurityPolicy, headersFile, inlineScriptHashes } from './security-headers.mjs';
import { extractOgImage, extractSeoLinks, redirectsFile, robotsTxt, sitemapXml } from './seo-files.mjs';

const ROOT = 'dist/portfolio/browser';
const SITE_URL = 'https://www.emanueledelmonte.it';

async function htmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  return entries
    .filter((e) => e.isFile() && e.name === 'index.html')
    .map((e) => join(e.parentPath ?? e.path, e.name));
}

const pages = [];
const htmls = [];
for (const locale of ['en', 'it']) {
  // the latin subset covers every glyph of both languages
  const font = (await readdir(join(ROOT, locale, 'media'))).find((name) => /^instrument-sans-latin-wdth-normal-.*\.woff2$/.test(name));
  if (!font) throw new Error(`postbuild: latin font not found in ${locale}/media`);
  for (const file of await htmlFiles(join(ROOT, locale))) {
    const html = withFontPreload(await readFile(file, 'utf8'), `media/${font}`);
    await writeFile(file, html);
    htmls.push(html);
    const og = extractOgImage(html);
    if (og) {
      await readFile(join(ROOT, new URL(og).pathname)).catch(() => {
        throw new Error(`postbuild: ${og} is missing, run npm run og:images`);
      });
    }
    const links = extractSeoLinks(html);
    if (links) pages.push(links);
  }
}
pages.sort((a, b) => a.canonical.localeCompare(b.canonical));

if (pages.length === 0) throw new Error('postbuild: no indexable pages found, is the build output where expected?');

const isPublic = (url) => PUBLIC_REPOS.includes(url);
const geo = geoFiles({ en: onlyPublic(CONTENT_EN, isPublic), it: onlyPublic(CONTENT_IT, isPublic) });
// the repositories this build links: .github/workflows/repos.yml compares them with GitHub's answer every day
await writeFile(join(ROOT, 'repos.json'), `${JSON.stringify(PUBLIC_REPOS)}\n`);
for (const file of geo) {
  await mkdir(dirname(join(ROOT, file.path)), { recursive: true });
  await writeFile(join(ROOT, file.path), file.body);
}
console.log(`postbuild: ${String(geo.length)} Markdown and llms files`);

await writeFile(join(ROOT, 'sitemap.xml'), sitemapXml(pages));
await writeFile(join(ROOT, 'robots.txt'), robotsTxt(SITE_URL));
await writeFile(join(ROOT, '_redirects'), redirectsFile(pages));
const hashes = inlineScriptHashes(htmls);
await writeFile(join(ROOT, '_headers'), headersFile(contentSecurityPolicy(hashes)));
console.log(`postbuild: sitemap.xml with ${pages.length} pages, robots.txt, _redirects, _headers (${hashes.length} inline script hashes)`);

const homeHtml = await readFile(join(ROOT, 'en', 'index.html'), 'utf8');
let initialBytes = 0;
for (const file of initialScripts(homeHtml)) initialBytes += gzipSync(await readFile(join(ROOT, 'en', file))).length;
console.log(`postbuild: initial JavaScript ${(initialBytes / 1024).toFixed(1)} KB gzip (budget ${String(INITIAL_JS_BUDGET / 1024)} KB)`);
if (initialBytes > INITIAL_JS_BUDGET) throw new Error('postbuild: initial JavaScript is over budget');
