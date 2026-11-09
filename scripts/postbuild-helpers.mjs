/** Adds a font preload so the web font is ready at first paint (no swap, no layout shift). */
export function withFontPreload(html, href) {
  const link = `<link rel="preload" href="${href}" as="font" type="font/woff2" crossorigin>`;
  if (html.includes(link)) return html;
  const at = html.indexOf('<link rel="stylesheet"');
  return at === -1 ? html.replace('</head>', `${link}</head>`) : html.slice(0, at) + link + html.slice(at);
}

/** The fonts a page preloads: the sans always, the serif only where a `.voice` span uses it. */
export function fontPreloads(html, { sans, serif }) {
  return /class="(?:[^"]*\s)?voice(?:\s[^"]*)?"/.test(html) ? [sans, serif] : [sans];
}

/** Initial JavaScript of a page: the module entry points plus what the page preloads. */
// gzip bytes, under spec §12's 150: the home was 138.7 KB once each language's content became its own chunk (issue
// #359); importing both again (about +6 KB) must fail here. 143 since the moai stands on every page (issue #393): its
// figure left the home's lazy chunk for the shell, 141.2 KB
export const INITIAL_JS_BUDGET = 143 * 1024;

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
