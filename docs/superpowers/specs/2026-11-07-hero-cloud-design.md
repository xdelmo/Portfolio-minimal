# Hero: the pixel cloud and the two-voice headline (issue #304)

Status: design approved in the brainstorming of 2026-11-07, plan to follow.

## Why

The owner finds the home hero impersonal and bare: a centred headline in a condensed sans over a faint field of dots reads like any tech site. Three references were studied (sebg.ch, macmillan.studio, andreas.vision); the owner picked andreas.vision's direction, a headline sitting in a clearing of a pixel cloud, rebuilt with the pixels and palette of his own `edm.` mark. He also finds the site's type impersonal ("it looks like any tech site").

Success: in the first screen a visitor sees a hero that could only be Emanuele's (his pixels, his colours, his voice), while the hero stays as fast and accessible as today.

## What the visitor sees

- The first screen is the hero. In the middle, a clearing in the page's background colour holds, centred, the headline, the lede and the two buttons. Copy is unchanged (owner's words, both languages):
  - IT: "Ingegnere per metodo, curioso per natura." / "Sono Emanuele, Frontend Engineer in IPS S.p.A., …" (the current lede in `content.it.ts`).
  - EN: "Engineer by method, curious by nature." and the current English lede.
- Around the clearing, a cloud of pixels fills the rest of the hero. The cloud is full bleed (edge to edge, the hero's whole height) and made of solid 16px squares that touch (`CLOUD_CELL` in `pixel-field/field.ts`), with a clearing shaped like the approved mockup's: a soft, noisy ellipse (radii 40% of the hero, 46% by 40% on phones) grown until the text fits inside it. The cells never lit are the text's own line boxes and buttons, melted into one shape and padded by two cells, not their container; the rim's noise is measured from the ellipse, so the clearing never traces the text's box, edges or corners, at rest, while drifting or while composing. Colour runs from `--px-1` (signal blue, densest, at the hero's edges) through `--px-2`/`--px-3` to lavender `--px-4`/`--px-5` near the clearing, with sparse peach `--px-6`. Tokens only, so both themes work; no green.
- Dark theme: the same cloud with the dark `--px-*` values, toned down (the mockup used 0.78 opacity; the builder tunes it). The clearing's edge must be clean in dark, not speckled near the text.
- Phone: the clearing becomes tall and narrow, the cloud thins to the edges; pixels keep their size. Buttons stack. Text never sits on pixels: the clearing is sized from the text block, not the other way round.
- Reference mockup: `.superpowers/brainstorm/6252-1794051820/content/hero-split-v3.html` (git-ignored, local only; the cloud there is a rough static stand-in).

## The headline in two voices

The headline splits at its comma into two lines:

- "Ingegnere per metodo," / "Engineer by method,": Instrument Sans, weight 600, `wdth` 100 (normal width, no longer the condensed 75).
- "curioso per natura." / "curious by nature.": **Instrument Serif italic**, weight 400, about 1.14× the sans size (an italic serif looks smaller at the same size).

The owner chose the italic knowingly: the detector flags italic serif heroes as a trend, and the owner prefers it here because only the "curious" half is italic and the split mirrors the words. Suppress the `italic-serif-display` finding for the home file only (`impeccable hooks ignore-value italic-serif-display "*" --file <home file>`, reason "user confirmed 2026-11-07").

It stays one `<h1>` (screen readers read one sentence). The content files need the two halves; whether `hero.headline` becomes two fields or the template splits at the comma is the builder's call, but `scripts/og-images.mjs` and `scripts/geo-files.mjs` read `c.hero.headline` as one string and must keep getting the full sentence.

Instrument Serif comes from `@fontsource/instrument-serif` (italic, latin subset only), declared in `src/styles/_fonts.scss` with `font-display: optional` and preloaded by `scripts/postbuild.mjs` like the sans, so CLS stays 0. Only the hero uses it. Add it to `DESIGN.md` (typography) and `.claude/skills/edm-style/SKILL.md`.

## Type across the site

The owner also asked to carry the two faces into the rest of the site, following the impeccable typeset analysis of 2026-11-07. The rule mirrors the headline: **the sans is the method, the italic serif is the curiosity.**

- **Instrument Sans, every heading at normal width.** All `h1`/`h2`/`h3` and display texts move from `wdth` 75/85 to `wdth` 100 (`src/styles/_base.scss` h1–h3, the About statement in `home.ts`, the 404 title, case-study and article titles, at-a-glance and the site menu where they set `wdth` 85). The condensed widths were the main "any tech site" signal. Weight 600 and tight tracking stay. Wider headings wrap more: check every page on phone and desktop, and the e2e that measure titles (grep for `wdth`, `fontVariationSettings`, `font-variation-settings`).
- **Instrument Serif italic in three places only**, always the second, "curious" half of a display sentence, never a paragraph, label or button:
  - the hero: "curioso per natura." / "curious by nature.";
  - the About statement: "Curo le parti che nessuno vede / ma tutti sentono." (EN: "I care about the parts users never see / but always feel."; the italic half starts at "ma" / "but");
  - the 404 title: only the word "wild" in "A wild 404 appeared!", in Italian "selvatico" in "È apparso un 404 selvatico!".
  The italic serif loads on these pages only through the same preloaded file; `font-display: optional` everywhere.
- **Real italic for the blog.** `<em>` in blog prose is today a faux italic (only the upright sans is declared). Declare Instrument Sans italic (latin, `wdth` axis file from `@fontsource-variable/instrument-sans`) and use it for `em` in prose; it may load on blog pages only. Instrument Serif is never used at body size.
- **Stay sans:** the intro's name, section titles ("Selected work", "Experience", …), the contact finale's "Get in touch", menus, buttons, metadata.
- `motion/effects/hero.ts` and any effect reading `--hero-wdth` or the headline's width lose the widening; `site-intro.ts` keeps its look but at the new width if it sets one.

## Motion

The cloud grows out of the existing `PixelField` rather than replacing it, so its living behaviour stays:

- the vignette that fades the field towards the edges becomes a cloud mask: noise decides which cells are lit and which tone they get, dense at the edges, empty in the clearing;
- the cloud breathes: its edge drifts slowly by a few cells;
- the cloud drifts with the wind, as on andreas.vision: its noise slides sideways across the hero in about 40 s, a whole cell at a time on the hero seam's grid (redrawn at most 24 times a second), while the clearing stays put; the grid is the seam's, so the cloud's squares run on into the seam below;
- the compose-in grows each cell late by its own random amount, so cells of one depth never grow in step and never draw the mask's contour;
- with a mouse, the cloud near the pointer pulls back a little, as if the clearing widened (replaces today's pointer glow);
- tap ripples and the Konami level-up rings (`GAME_START`) keep crossing the cloud as today;
- the compose-in at load stays (about 1.4 s);
- reduced motion: a still cloud, no breathing, no ripples (as `PixelField` already behaves);
- `MotionPause` pauses the breathing like every long animation.

The headline: drop the `wdth` widening in `motion/effects/hero.ts` (75 → 85), the new headline is at normal width. Keep the entrance after the intro and the drift on scroll, adapted to two lines.

The hero's bottom seam (`app-pixel-dissolve.seam--hero`) stays; the cloud's lower edge should meet it without a visible gap.

## Constraints

- The headline (text) stays the LCP and paints before the cloud; the cloud draws after the first paint as today. Lighthouse mobile performance ≥ 0.95 (`npm run lhci`), CLS 0; the extra font file must be measured.
- WCAG 2.2 AA in both themes and languages; axe clean. All hero text sits on the clearing (page background), never on pixels.
- The current layout of the hero is not a constraint.
- The cloud's canvas stays `aria-hidden`, decorative.

## Tests to update

Grep the e2e for the hero's texts, classes and the field before changing them: at least `e2e/pixel-field.spec.ts`, `e2e/field-draws.ts`, `e2e/motion.spec.ts`, `e2e/mobile-motion.spec.ts`, `e2e/game.spec.ts`, `e2e/layout.spec.ts`, `e2e/pages.spec.ts`. The unit tests of `pixel-field/field.ts` and `render.ts` cover the cloud mask as pure functions. Run the OG images (`npm run og:images`) only if the headline string changes.

## Non-goals

- No change to the hero copy, the buttons, the header or the layout of the rest of the home.
- No serif beyond the three places above; no third family.
- No new 3D or video in the hero.

## Left to the builder

The noise function and its parameters, the breathing speed, how far the cloud pulls back from the pointer, the exact dark-theme toning, the font sizes per breakpoint (the mockup used about 5.3% of the hero width on desktop), and how the clearing's shape is computed from the text block.

## Spec log

Add a row to §17 of `docs/superpowers/specs/2026-10-03-portfolio-v2-design.md`: hero redesigned as a pixel cloud with a two-voice headline (Instrument Sans + Instrument Serif italic); headings site-wide at normal width; italic serif for the curious half of the hero, About statement and 404; real sans italic in blog prose; issue #304. Update `DESIGN.md` typography (the `wdth` values, a `voice` role for the serif) and `.claude/skills/edm-style/SKILL.md` to match.

## Calls made by Claude (not discussed with the owner)

- The 404’s italic word is "wild" / "selvatico".
- The sans italic loads only on blog pages.
- Splitting the work in two pull requests is fine (hero first, then type across the site) if the builder prefers smaller reviews.
