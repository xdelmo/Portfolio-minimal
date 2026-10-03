const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'PerplexityBot',
  'Google-Extended',
  'Applebot-Extended',
];

function attr(tag, name) {
  return tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];
}

export function extractSeoLinks(html) {
  const tags = html.match(/<link\b[^>]*>/g) ?? [];
  let canonical = null;
  const alternates = [];
  for (const tag of tags) {
    const rel = attr(tag, 'rel');
    if (rel === 'canonical') canonical = attr(tag, 'href');
    if (rel === 'alternate' && attr(tag, 'hreflang') && attr(tag, 'hreflang') !== 'x-default') {
      alternates.push({ hreflang: attr(tag, 'hreflang'), href: attr(tag, 'href') });
    }
  }
  return canonical ? { canonical, alternates } : null;
}

export function sitemapXml(pages) {
  const urls = pages
    .map(
      (p) =>
        `  <url>\n    <loc>${p.canonical}</loc>\n` +
        p.alternates.map((a) => `    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${a.href}"/>\n`).join('') +
        `  </url>`,
    )
    .join('\n');
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
    `${urls}\n</urlset>\n`
  );
}

export function robotsTxt(siteUrl) {
  return (
    `User-agent: *\nAllow: /\n\n` +
    `# AI search and assistant crawlers are welcome\n` +
    AI_CRAWLERS.map((bot) => `User-agent: ${bot}`).join('\n') +
    `\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`
  );
}
