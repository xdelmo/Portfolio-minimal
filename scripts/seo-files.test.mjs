import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractOgImage, extractSeoLinks, robotsTxt, sitemapXml, redirectsFile } from './seo-files.mjs';

const html = `<head>
<link rel="canonical" href="https://www.emanueledelmonte.it/en/work/apexflow" data-seo="">
<link rel="alternate" href="https://www.emanueledelmonte.it/en/work/apexflow" hreflang="en" data-seo="">
<link rel="alternate" href="https://www.emanueledelmonte.it/it/work/apexflow" hreflang="it" data-seo="">
</head>`;

test('extractSeoLinks reads canonical and alternates whatever the attribute order', () => {
  assert.deepEqual(extractSeoLinks(html), {
    canonical: 'https://www.emanueledelmonte.it/en/work/apexflow',
    alternates: [
      { hreflang: 'en', href: 'https://www.emanueledelmonte.it/en/work/apexflow' },
      { hreflang: 'it', href: 'https://www.emanueledelmonte.it/it/work/apexflow' },
    ],
  });
});

test('extractSeoLinks returns null for pages without canonical (noindex)', () => {
  assert.equal(extractSeoLinks('<head></head>'), null);
});

test('sitemapXml lists each page with its alternates', () => {
  const xml = sitemapXml([extractSeoLinks(html)]);
  assert.match(xml, /<loc>https:\/\/www\.emanueledelmonte\.it\/en\/work\/apexflow<\/loc>/);
  assert.match(xml, /<xhtml:link rel="alternate" hreflang="it" href="https:\/\/www\.emanueledelmonte\.it\/it\/work\/apexflow"\/>/);
  assert.match(xml, /^<\?xml version="1.0" encoding="UTF-8"\?>/);
});

test('robotsTxt allows everyone, names AI crawlers and points to the sitemap', () => {
  const txt = robotsTxt('https://www.emanueledelmonte.it');
  for (const bot of ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended']) {
    assert.match(txt, new RegExp(`User-agent: ${bot}`));
  }
  assert.match(txt, /Sitemap: https:\/\/www\.emanueledelmonte\.it\/sitemap\.xml/);
  assert.doesNotMatch(txt, /Disallow: \//);
});

test('extractOgImage reads the og:image meta, or null', () => {
  assert.equal(extractOgImage('<meta property="og:image" content="https://x/en/og/en-home.png">'), 'https://x/en/og/en-home.png');
  assert.equal(extractOgImage('<meta name="robots" content="noindex">'), null);
});

test('redirectsFile serves each slash-less canonical from its folder, without the trailing-slash 301', () => {
  const pages = [
    { canonical: 'https://www.emanueledelmonte.it/en/', alternates: [] },
    { canonical: 'https://www.emanueledelmonte.it/it/work/apexflow', alternates: [] },
  ];
  assert.equal(redirectsFile(pages), '/it/work/apexflow  /it/work/apexflow/index.html  200!\n');
});
