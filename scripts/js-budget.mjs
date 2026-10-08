/** Initial JavaScript of a page: the module entry points plus what the page preloads. */
export const INITIAL_JS_BUDGET = 150 * 1024; // gzip bytes, spec §12

export function initialScripts(html) {
  const found = new Set();
  for (const [, src] of html.matchAll(/<script[^>]*\ssrc="([^"]+)"[^>]*type="module"/g)) found.add(src);
  for (const [, src] of html.matchAll(/<script[^>]*type="module"[^>]*\ssrc="([^"]+)"/g)) found.add(src);
  for (const [, href] of html.matchAll(/<link[^>]*rel="modulepreload"[^>]*href="([^"]+)"/g)) found.add(href);
  return [...found];
}
