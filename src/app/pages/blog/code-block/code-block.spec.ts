import { highlightCode } from './code-block';

describe('highlightCode', () => {
  it('escapes < > & " \' when lang is missing or unknown', () => {
    const raw = '<tag> & "double" \'single\'';
    const expected = '&lt;tag&gt; &amp; &quot;double&quot; &#39;single&#39;';

    expect(highlightCode(raw)).toBe(expected);
    expect(highlightCode(raw, 'unknown')).toBe(expected);
  });

  it('escapes raw characters and wraps strings into a single tok-str span for ts', () => {
    const raw = 'a < b && "x"';
    const result = highlightCode(raw, 'ts');

    expect(result).toBe('a &lt; b &amp;&amp; <span class="tok-str">&quot;x&quot;</span>');

    const outsideTags = result.replace(/<[^>]+>/g, '');
    expect(outsideTags).not.toContain('<');
    expect(outsideTags.replace(/&(?:amp|lt|gt|quot|#39);/g, '')).not.toContain('&');

    const strMatches = result.match(/<span class="tok-str">.*?<\/span>/g);
    expect(strMatches).toEqual(['<span class="tok-str">&quot;x&quot;</span>']);
  });

  it('keeps keywords inside a string inside tok-str without tagging them with tok-kw', () => {
    const result = highlightCode('"const"', 'ts');

    expect(result).toBe('<span class="tok-str">&quot;const&quot;</span>');
    expect(result).toContain('tok-str');
    expect(result).not.toContain('tok-kw');
  });

  it('tags a keyword outside strings with tok-kw', () => {
    const result = highlightCode('const', 'ts');

    expect(result).toBe('<span class="tok-kw">const</span>');
  });
});
