/** Adds a font preload so the web font is ready at first paint (no swap, no layout shift). */
export function withFontPreload(html, href) {
  const link = `<link rel="preload" href="${href}" as="font" type="font/woff2" crossorigin>`;
  if (html.includes(link)) return html;
  const at = html.indexOf('<link rel="stylesheet"');
  return at === -1 ? html.replace('</head>', `${link}</head>`) : html.slice(0, at) + link + html.slice(at);
}
