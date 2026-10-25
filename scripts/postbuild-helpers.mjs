/** Adds a font preload so the web font is ready at first paint (no swap, no layout shift). */
export function withFontPreload(html, href) {
  const link = `<link rel="preload" href="${href}" as="font" type="font/woff2" crossorigin>`;
  if (html.includes(link)) return html;
  const at = html.indexOf('<link rel="stylesheet"');
  return at === -1 ? html.replace('</head>', `${link}</head>`) : html.slice(0, at) + link + html.slice(at);
}

/** Initial JavaScript of a page: the module entry points plus what the page preloads. */
export const INITIAL_JS_BUDGET = 150 * 1024; // gzip bytes, spec §12

export function initialScripts(html) {
  const found = new Set();
  for (const [, src] of html.matchAll(/<script[^>]*\ssrc="([^"]+)"[^>]*type="module"/g)) found.add(src);
  for (const [, src] of html.matchAll(/<script[^>]*type="module"[^>]*\ssrc="([^"]+)"/g)) found.add(src);
  for (const [, href] of html.matchAll(/<link[^>]*rel="modulepreload"[^>]*href="([^"]+)"/g)) found.add(href);
  return [...found];
}
