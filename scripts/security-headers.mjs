// HTTP security headers for Netlify (issue #113): a Content-Security-Policy that runs only the site's own scripts and
// the inline ones the prerender writes (the theme script in index.html, Angular's event dispatch contract and its
// bootstrap), allowed by hash; computed from the built pages at every build, so a change to them never needs a hand edit.
import { createHash } from 'node:crypto';

const INLINE_SCRIPT = /<script(\s[^>]*)?>([\s\S]*?)<\/script>/g;
// data blocks (JSON-LD, Angular's transfer state) are never run, so a CSP does not apply to them
const EXECUTABLE = (attrs) => !/\ssrc=/.test(attrs) && !/\stype="(?!text\/javascript"|module")[^"]*"/.test(attrs);

/** The sha256 sources of every inline script that runs, across all pages, sorted and without repeats. */
export function inlineScriptHashes(htmls) {
  const hashes = new Set();
  for (const html of htmls) {
    for (const [, attrs = '', body] of html.matchAll(INLINE_SCRIPT)) {
      if (!body || !EXECUTABLE(attrs)) continue;
      hashes.add(`'sha256-${createHash('sha256').update(body).digest('base64')}'`);
    }
  }
  return [...hashes].sort();
}

/**
 * Styles stay 'unsafe-inline': Angular inlines component styles and the templates bind style attributes (the pixel
 * cells' --t and fill); nothing else may load from another origin.
 */
export function contentSecurityPolicy(hashes) {
  return [
    "default-src 'self'",
    `script-src 'self' ${hashes.join(' ')}`.trim(),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
}

/** The other headers: no MIME sniffing, no framing, the origin only to other sites, no device APIs, own browsing group. */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
};

/** Netlify's `_headers` file: every path gets the CSP and the headers above. */
export function headersFile(csp) {
  const lines = ['/*', `  Content-Security-Policy: ${csp}`, ...Object.entries(SECURITY_HEADERS).map(([k, v]) => `  ${k}: ${v}`)];
  return `${lines.join('\n')}\n`;
}
