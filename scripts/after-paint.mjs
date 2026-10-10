/**
 * Starts Angular after the first frame (issue #151): the page is prerendered and complete without JavaScript, and
 * Lighthouse puts every request started before the first paint on the critical path of FCP and LCP. The module entry
 * points become one inline loader (allowed by the CSP through its hash, like the other inline scripts) and the
 * modulepreloads go: main imports those chunks anyway. Clicks before hydration are kept by Angular's event replay.
 * `async = false` keeps the order (polyfills before main), which dynamically inserted scripts do not have by default.
 */
const MODULE = /<script src="([^"]+)" type="module"><\/script>/g;

export function withScriptsAfterPaint(html) {
  const srcs = [...html.matchAll(MODULE)].map(([, src]) => src);
  if (srcs.length === 0) return html;
  const loader =
    `<script>requestAnimationFrame(()=>setTimeout(()=>{for(const s of ${JSON.stringify(srcs)}){` +
    `const e=document.createElement("script");e.type="module";e.async=false;e.src=s;document.body.append(e)}}))</script>`;
  let first = true;
  return html.replace(/<link rel="modulepreload"[^>]*>/g, '').replace(MODULE, () => {
    if (!first) return '';
    first = false;
    return loader;
  });
}
