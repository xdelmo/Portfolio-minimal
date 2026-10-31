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

/**
 * Published as /sw.js (issue #289). The old Gatsby site registered a service worker there (gatsby-plugin-offline,
 * scope /) that kept answering / from its cache to past visitors; a 404 on /sw.js leaves it installed, so the browser's
 * next update check must find this one: it empties the caches, unregisters itself and reloads the open pages.
 */
export const SW_KILL_SWITCH = `self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) await caches.delete(key);
    await self.registration.unregister();
    for (const client of await self.clients.matchAll({ type: 'window' })) client.navigate(client.url);
  })());
});
`;
