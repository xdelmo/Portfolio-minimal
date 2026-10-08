// Checks a Netlify deploy against the redirect, 404 and SEO/GEO rules (spec §8, §9, §14).
// Usage: npm run verify:deploy -- https://v2--<site>.netlify.app
import { argv, exit } from 'node:process';
import { URL } from 'node:url';

const it = { 'accept-language': 'it-IT,it;q=0.9,en;q=0.8' };

export const CHECKS = [
  { name: '/ with it-IT goes to /it/', path: '/', headers: it, status: 302, location: '/it/' },
  { name: '/ with it-CH goes to /it/', path: '/', headers: { 'accept-language': 'it-CH' }, status: 302, location: '/it/' },
  { name: '/ with de-DE goes to /en/', path: '/', headers: { 'accept-language': 'de-DE,de;q=0.9' }, status: 302, location: '/en/' },
  { name: '/ with it-IT and nf_lang=en goes to /en/', path: '/', headers: { ...it, cookie: 'nf_lang=en' }, status: 302, location: '/en/' },
  { name: 'legacy /privacy goes to the Italian privacy page', path: '/privacy', status: 301, location: '/it/privacy/' },
  { name: 'Italian privacy page', path: '/it/privacy/', status: 200, contains: '<html lang="it"' },
  ...['/imprint', '/blog/x', '/my-first-article'].map((path) => ({ name: `legacy ${path} goes to /it/`, path, status: 301, location: '/it/' })),
  { name: 'English home', path: '/en/', status: 200, contains: '<html lang="en"' },
  { name: 'Italian case study answers at its canonical URL, no trailing-slash redirect', path: '/it/work/apexflow', status: 200, contains: 'ApexFlow' },
  { name: 'wrong slug /en/work/apexflw is a 404', path: '/en/work/apexflw', status: 404, contains: 'A wild 404 appeared' },
  { name: 'wrong slug /it/work/apexflw is an Italian 404', path: '/it/work/apexflw', status: 404, contains: 'È apparso un 404 selvatico' },
  { name: 'unknown root URL with it-IT is an Italian 404', path: '/nope', headers: it, status: 404, contains: 'È apparso un 404 selvatico' },
  { name: 'sitemap.xml', path: '/sitemap.xml', status: 200, contains: '<urlset' },
  { name: 'robots.txt allows AI crawlers', path: '/robots.txt', status: 200, contains: 'ClaudeBot' },
  { name: 'llms.txt', path: '/llms.txt', status: 200, contains: '# Emanuele Del Monte' },
  { name: 'index.md is served as Markdown', path: '/en/index.md', status: 200, contentType: 'text/markdown', contains: '# Emanuele Del Monte' },
  { name: 'og image for the Italian home', path: '/it/og/it-home.png', status: 200, contentType: 'image/png' },
];

async function check(base, fetchImpl, c) {
  try {
    const res = await fetchImpl(new URL(c.path, base), { redirect: 'manual', headers: c.headers ?? {} });
    const problems = [];
    if (res.status !== c.status) problems.push(`status ${String(res.status)}, expected ${String(c.status)}`);
    if (c.location) {
      const got = res.headers.get('location');
      if (!got || new URL(got, base).href !== new URL(c.location, base).href) problems.push(`location ${String(got)}, expected ${c.location}`);
    }
    if (c.contentType && !(res.headers.get('content-type') ?? '').startsWith(c.contentType)) problems.push(`content-type ${String(res.headers.get('content-type'))}`);
    if (c.contains && !(await res.text()).includes(c.contains)) problems.push(`body lacks "${c.contains}"`);
    return { name: c.name, ok: problems.length === 0, detail: problems.join('; ') };
  } catch (error) {
    return { name: c.name, ok: false, detail: String(error) };
  }
}

export async function runChecks(base, fetchImpl = globalThis.fetch, checks = CHECKS) {
  const rows = [];
  for (const c of checks) rows.push(await check(base, fetchImpl, c));
  return rows;
}

if (import.meta.url === `file://${argv[1]}`) {
  const base = argv[2];
  if (!base) {
    console.error('Usage: npm run verify:deploy -- <base-url>');
    exit(2);
  }
  const rows = await runChecks(base);
  for (const r of rows) console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${r.name}${r.detail ? ` — ${r.detail}` : ''}`);
  exit(rows.every((r) => r.ok) ? 0 : 1);
}
