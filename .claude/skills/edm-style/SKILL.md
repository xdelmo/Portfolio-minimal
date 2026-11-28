---
name: edm-style
description: Visual style rules of Emanuele Del Monte's portfolio (www.emanueledelmonte.it). Use before designing, restyling or animating anything in this repo — new sections, components, colours, motion, mobile layouts — and when reviewing a UI change for consistency with the site.
---

# edm. — style directives

The site is a quiet, text-first portfolio built on an **8px pixel grid**, with a few pixel-art objects that have a life of their own. Read this before any visual change; the code is the source of truth for values (`src/styles/_tokens.scss`, `src/styles/_base.scss`).

## Identity in one line

Concrete grey page, ink text, one Signal Blue; pastel pixels (blue tints, lavender, peach) for the things that move. Everything snaps to 8px; edges are stepped, not smooth.

## Colour

- Always CSS custom properties from `_tokens.scss`; the theme switches them at runtime, so never hard-code a hex in a component.
- Every new colour needs a light **and** a dark value, both checked.

| Role | Token | Light | Dark |
|---|---|---|---|
| Page | `--bg` | `#dedede` concrete | `#121212` night |
| Surface | `--surface` | `#f2f2f2` paper | `#202020` slate |
| Text | `--fg` | `#1d1d1c` ink | `#dedede` |
| Secondary text | `--fg-muted` | `#555` | `#aaa` |
| Accent (button fill) | `--accent` | `#0058b8` | `#0066d4` |
| Links, focus | `--link`, `--focus` | `#0058b8` | `#4d9bf0` |
| Thin accent lines and UI indicators (thread, pixel cursor, current slot/toc/language markers, meters, timeline/combo cells, blockquote) | `--accent-line` | `#0058b8` | `#4d9bf0` |
| Pixel palette, decoration only | `--px-1`…`--px-6` | blue, blue tints, lavender ×2, peach | brighter versions |
| Moai | `--stone*`, `--moai-eye-white` | warm greys | darker greys |
| Nutella, the 404's chihuahua | `--nutella-*` (cream, white, tan, saddle, ear, black) | her coat from the photo | slightly darker |

- **No green, ever** (the user's brand is greys, the blue family, lavender, peach). This includes "success" states and syntax colours.
- The `--px-*` colours never carry text. Text on pastel uses the band ink tokens (`--band-pastel-*`).
- Text selection is a peach highlighter: `--selection-bg` (`#ffb88f`) under `--selection-fg` (ink `#1d1d1c`), the same in both themes and on every band (issue #568). Never the pastel blue or lavender: they are band backgrounds, and a selection on them would vanish.
- Sections change mood through **bands** (`.band--pastel` for About, `.band--lavender` for the side quests, `.band--ink` for the contact finale and footer); on the home page plain sections and bands alternate; a band re-points `--fg`, `--link`, `--focus`, `--accent-line`, `--rule`, so the contents and meters follow by themselves.

## Type

- One family: **Instrument Sans Variable** (`wght` 400–700, `wdth` 75–100), self-hosted with `font-display: optional` (keeps CLS 0; do not switch to the package CSS).
- One second voice: **Instrument Serif italic** (`@fontsource/instrument-serif`, latin only, `font-display: optional`, preloaded), about 1.14× the sans size, only for the curious half of a display sentence (hero headline and About statement for now), never a paragraph, label or button. The sans is the method, the italic serif is the curiosity. The detector's `italic-serif-display` finding is suppressed for `home.ts` only (user confirmed 2026-11-07).
- Headings weight 600: the hero `h1` at `wdth` 100 (normal width, no widening on scroll), `h2`/`h3` at `wdth` 85; body at `wdth` 100, 18px, line-height 1.55, max 53ch (`--measure`, about 75 characters a line; the zero is wider than the average letter).
- Modular scale 1.25 on 18px: `--step--1` … `--step-5`, `--step-hero` fluid 44→96px. Contact title is the one oversized exception (up to 9rem).
- Sentence case everywhere (one exception the user asked for: the full name in the header, tracked capitals on two lines beside the moai mark, like a letterhead; and the pixel arrow after the giant contact title, the title's own action). **No** all-caps labels, eyebrow labels, monospace metadata, middle-dot meta strings, arrows appended to links, or a single accented word in a headline. The one middle dot left, between name and version in the footer, sits in a `.sep` span with `margin-inline: 0.25em`: Instrument Sans draws the space and the dot so narrow that a plain ` · ` looks glued to the words (issue #663).

## Grid and shape

- Spacing only from `--space-1` (8px) … `--space-16` (128px). Home sections pad 64px above and below; projects sit 64px apart. Sizes of icons, cells and images are multiples of 8. The pixels of the living objects (hero cloud, seams, the intro's row of squares) are 16px cells (`CLOUD_CELL`); 8px cells are for small UI (pixel cursor, combo row, meters, pixel burst), issue #677.
- Vertical rhythm: 64px (`--space-8`) from a section's edge to its title and from its last line to what follows; a section followed by a band adds the band's 48px pixel seam (`home.ts`, `.section:has(+ .band > .seam)`). Pinned blocks keep their own height (a pin stretched to the screen leaves its spare room on the page once it ends).
- Content column left-aligned, max 1200px, gutter 16px (32px from md). Breakpoints through `@use 'styles/breakpoints' as bp; @include bp.up(md)`.
- A row of short links on touch screens reaches the 44px target with the same side padding on every link (the row moving back by it to keep its left edge), never with `min-width` alone: that pads only the short words, on one side, and their gap looks wider (footer, issue #665, guarded by `e2e/touch.spec.ts`).
- No row of three identical tiles (icon or title over a short text, repeated): list things as full-width rows under a 1px `--rule`, so the words keep their width (issue #533).
- Secondary actions beside a primary button match its 48px height and type size; body text and bullet lists keep to `--measure`.
- No rounded cards, no soft drop shadows, no gradients as decoration. Hard edges; the only shadow is the hard 4px offset on the primary button hover and stepped preview/next cards (`.next:hover`, `.post-preview`).
- **Stepped shapes instead of smooth ones**: icons are 8×8 SVGs (brand marks 16×16: `github-mark.ts`, `linkedin-mark.ts`; the site's own logo is the moai, `moai-mark.ts`, one colour through `currentColor`, the same drawing as the favicon from `scripts/favicon.mjs`, never below 16 px or in a second colour; only its brow reaches the drawing's right edge, so on phones the header pulls it 2px towards the rule to balance the 8px either side, issue #667) with `shape-rendering="crispEdges"` and `fill="currentColor"`; round things are pixel circles (see the contact photo mask, 16 cells across); transitions use `steps()` where they suit (buttons, the language curtain).
- Soft round things are allowed only as **light** (radial gradients, no `filter: blur`).

## The living objects (where the boldness goes)

Spend boldness here, keep everything else calm:

1. **Hero pixel cloud** (`PixelField`) — a full-bleed cloud of solid 16px squares that touch (`CLOUD_CELL`) on the hero seam's grid, around a clearing in the page colour that holds the headline, lede and buttons: a noisy ellipse grown round the text's own line boxes (tall and narrow on phones), whose rim never traces the text's box or corners; `--px-1` blue densest at the edges, lavender near the clearing, sparse peach, tokens only. Text never sits on pixels. The cloud composes in (each cell late by its own jitter), drifts with the wind (about 80 s across, a cell at a time), breathes at its edge, pulls back from the pointer, ripples on tap and under the Konami rings; still with reduced motion, paused by `MotionPause`. As the hero scrolls away (issue #593) it is one scrubbed movement, trailing the scroll by about a second (`scrub: 1`) so it never feels hurried: by 40% the `.copy` has faded out while the headline keeps its drift, by 70% the cloud has closed over the clearing cell by cell (each at its own threshold, never a shrinking contour) and the wind has sped up a little (3 cells at most), then cloud and hero seam crumble together, top rows first, gone as the hero's foot reaches the header. Text never sits on pixels: it is gone before the first cell closes. Scrolling back plays it backwards; nothing with reduced motion. A link inside the faded `.copy` that takes focus shows the text again (`:focus-within`), and the hero seam's `--p` belongs to the hero's timeline alone (`dissolve.ts` skips `.seam--hero`): every `--p` has exactly one owner.
2. **Voxel moai** (the site's mascot, in the About, issue #270) — Three.js, breathes, waves and says hello in its bubble the first time a visitor sees at least half of it (once ever, `WAVED_KEY` in localStorage, issues #670, #682), turns its head and eyes to the mouse, looks down while the page scrolls, falls asleep after 20 s without input with pixel z's (the pause stops it too); the hero stays text only, centred; desktop: whole, beside the About's text, pinned, then as the About scrolls away it tilts slightly forward and unbuilds voxel layer by voxel layer from the pukao down with a pastel pixel scanline (`--px-1`, `--px-4`, `--px-6`), stops on the About's foot once it reaches it and rides up with it, uncut, so no voxel ever paints over the Experience (`--moai-y`, issue #676), its shadow whole until the last row goes (on the way in too), vanishes cleanly across the band seam, and rematerializes from the ground up in the bottom-right corner (`140px` high, `16px` from the edges, only the moai itself takes clicks) with the pukao dropping last in crisp steps and a subtle stone settle (issue #661); on inner pages (`moai-guest.ts`, issue #393) it stands fixed in that bottom-right corner (`140px` high, `16px` from the edges, `~62px` wide) on `(min-width: 1024px) and (pointer: fine)`, so any wide link or button reaching the right edge of `.container` must step aside by `96px` from the viewport edge (`site-footer.scss`, `case-study.scss`, guarded by `e2e/moai.spec.ts`); phones: centred below the About's text; reduced motion keeps the still image; on phones it glances slowly around with pauses (never a spin on itself, removed on request), pixel pupils follow the cursor (no exit animation: the burst into cubes was removed on request); a double click or double tap blows a bubble of pink gum (`--gum`) from its lips that pops by itself.
3. **Tool levels** (`sections/stack-list/`, issue #365) — the tools by level, and the type size is the level: every day set large and condensed, in production smaller, side projects at body size and muted; each level a row under a 1px rule with its name and a pixel meter (3, 2, 1 cells) in a left column from md, above the tools on phones. The tools slide in from the right on scroll, the deeper levels from further. (The concentric rings it replaced spread the tools around circles and were slow to read.)
4. **The pixel thread** (home, and the case study index from `lg` up): an accent line down the left margin, a node per section lit as the scroll reaches it (case studies connect the four `nav.toc` nodes via `--toc` and show a 2px `--accent-line` reading bar under the header on phones/tablets); **seams** of crumbling pixels where a band meets the page, at the foot of the hero, and above the dark footer on inner pages (`site-footer.ts`, `main:has(+ app-site-footer .seam--footer)`): they form as they scroll in and crumble away as they rise towards the header (the hero's seam crumbles with its cloud, on the hero's own range; the inner-page footer seam forms on arrival). Both are `PixelDissolve` (stepped SVG layers driven by one `--p`) or the thread effect; reuse them before inventing a new transition.
5. **Side quest sprites**: each side quest is an item in a game inventory, a 16 × 16 pixel drawing (`sections/side-quests/sprites.ts`) in a hard square slot; it builds itself from the bottom as it scrolls in and hops in steps on hover, focus or tap. On phones the inventory is a bar swiped sideways: the item snapped to the middle is the selected one (accent frame, hop).
6. **Press start** (`src/app/game/`): the Konami code, five taps on the logo or the small "Press start" key in the footer open a player card in the ink band's colours, with pixel achievements drawn like the side quest sprites (Explorer is earned by reading every case study: a stepped notice on the last one); a hidden reward, never in the way. the Konami code shows a combo row of 8px cells from its third key and its card levels up (level climbing to 99 in steps, the bar filling, a few pastel pixels jumping out). Blog code-block and article-link copy buttons share a miniature version of that feedback (`motion/pixel-burst.ts`: six 8px `--px-*` squares jumping outward in `steps(3)` over 220ms, skipped with reduced motion or forced colours).
7. Transitions answering the user: theme circle reveal, language curtain in pixel steps, menu scramble (a clicked menu link settles on its word and full underline at once, before the page change's view transition takes its picture, and stays still until the pointer moves off it once the new page is live: issues #572, #574), pixel cursor and magnetic targets (including the case study "Next project" preview card with `data-snap-zone` and `effects/case-next.ts`, issue #644). Near a section `h2` the pixel cursor grows into a pixel arrow pointing at the title's words, ring by ring out of the square and back into it (`motion/arrow.ts`): drawn as lines on 8px cells, in eight directions only, because in between it smudges; never over the words themselves.

8. **Background music** (`layout/music-toggle.ts`, `src/app/music/`, issue #516): an 8-bit ambient loop on Game Boy style pulse waves behind a 16px speaker icon in the header and the phone menu (`aria-pressed`). Off on every page load and started only by a press; the player and the song are a lazy chunk loaded on that first press; it keeps playing across in-app navigation and stops with the motion pause (`watchPause()`), fading out rather than cutting.

9. **Nutella on the 404** (`voxel/nutella-figure/`, `voxel/nutella-scene/`, `voxel/nutella.motion.ts`, issues #632, #639): the user's chihuahua as the wild creature, voxels drawn like the moai (same cube size, lights, isometric camera and `--moai-shadow`), symmetric and with no loose cube (`nutella.model.spec.ts`), standing on a stepped pixel ellipse platform (`.foe::before`, `128px` on phones and `240px` from `md`). A square still PNG (`scripts/nutella-image.mjs`, `public/images/nutella{,-dark}.png`) renders from the start underneath until the first 3D frame is drawn and also serves as the fallback with reduced motion, reduced data or missing WebGL. Her pose steps at 12 fps (`POSE_FPS`) with idle wag bursts, random head tilts, blinks and ear flicks, shifts mood with the battle menu (`eager` on work/bag, `curious` on contact, `down` on run), hops on arrival and on click (`Nutella used Bark!` in the dialog box), and follows the pointer on desktop only (`(min-width: 1024px) and (hover: hover)`); still with reduced motion, under the pause button or out of sight. Three.js loads only once she is in view (`@defer (on viewport)`), the canvas is decorative, her continuous ground shadow (`nutellaShadowCells`) covers torso and paws centred on the `.foe::before` platform, and `appear` stays on the `.foe` wrapper with no continuous `idle` bob.

Photos load depixelating (`src/app/depixelate/`, as on locomotive.ca): a canvas draws them in ever finer blocks as they scroll in, then the photo shows; put `appDepixelate` on any new photo.

Projects without a screenshot show their pixel sprite in the same 3:2 frame as the screenshots (`Project.sprite`).

A new section gets **one** idea in this family, not a new visual language. Every page carries at least one (the blog index has its terminal sprite and, on desktop, a stepped project preview card on hover for rows linked to a project via `effects/blog-preview.ts`; case studies carry the stepped architecture diagram `app-case-diagram`, issue #645): a page with none reads as a template.

## Motion rules

- GSAP via the lazy `MOTION_LOADER`; effects live in `src/app/motion/effects/`, run by `[appMotion]` inside `gsap.matchMedia`, return a cleanup.
- `prefers-reduced-motion: reduce` → no effects at all, still images, no pause button.
- A CSS hover transition sits under `@media (hover: hover) and (prefers-reduced-motion: no-preference)` (`site-footer.scss`, the blog's cards and tags, issue #604); a transition that tells where you are, like the reading progress, needs only the reduced-motion half.
- Two grammars, nothing in between (issue #521): small feedback (hover, focus, press, a notice opening) moves in `steps(2–4)` over 80–240 ms, in CSS where it can; a surface that covers or uncovers the page (intro lift, language curtain, theme circle, the page change: the new page rises over the old one from the bottom edge as a whole sheet (`translate`, never a `clip-path` window, which shows the page's bottom first and tears the two pages into strips) while the old one dims to 0.2 and the header stays put, issue #555, unless the mobile menu is open: then the header goes with the page, issue #205, `_base.scss`; besides it only the fixed pixel cursor and its arrow carry a `view-transition-name`, so they stay under the pointer instead of rising with the page, issue #560; nothing else does: a named element slides between its old and new spot across the rising page, so project titles and screenshots have none, issues #256 and #551) glides on `--ease-cover`; an entrance lands on `--ease-arrive` (GSAP `power3.out`); scrubbed tweens use `ease: 'none'`. Entrances never overshoot (no `back.out`, elastic or bounce), and a CSS fallback uses the same ease as the GSAP effect it stands in for. One reveal per moment: section titles do not get their own entrance, the thread node and the seams already mark them.
- A wait is shown, never an empty pause (issue #322): a page change that takes more than 200ms draws a 4px `--accent-line` bar on the header's bottom edge (`layout/route-progress.ts`), creeping in `steps(16)` and never reaching the end, gone when the page arrives; with reduced motion it stands still. The router preloads every page while the browser is idle (`core/idle-preload.ts`), so the bar is rare: never add a full-screen loader.
- Pointer effects only at `(min-width: 1024px) and (hover: hover)`. Phones get their own motion (scroll and tap driven), never hover-only behaviour.
- Anything automatic that lasts more than 5s stops with the single header pause button (`MotionPause`, `watchPause()` for GSAP), the background music included. Sound never starts by itself: only a press on the music toggle starts it.
- Use `gsap.set` + `.to()` for scrubbed tweens; move elements GSAP also transforms through CSS `translate` variables (`--mx/--my`, `--fy/--rx/--ry`).
- Smooth scroll (ScrollSmoother) runs on desktop with a mouse only: nothing new may be `position: fixed` or `sticky` inside `#smooth-content` (use `data-sticky`, or live outside the wrapper).
- Phones: scroll and touch versions of each idea (field first, sticky experience cards that step back under the next one (desktop: a pinned deck under a chapter track of 8px cells), projects that straighten as they scroll in, pressed buttons, tool levels that step in, swipe on the moai); `touch-action: pan-y pinch-zoom` on anything swipeable, never block vertical scrolling.
- Decorations may fly in from the screen edges: the root (`html`) clips horizontally, so never clip a section just to hide them.

## Quality floor (every change)

- WCAG 2.2 AA in **both themes**: axe e2e in light and dark; check new colours in dark by eye too (a token that is light in one theme can turn black in the other).
- Bilingual: English source, Italian in `src/locale/messages.it.xlf` (the build fails on a missing unit); long copy in `src/app/content/content.{en,it}.ts`.
- Initial JS < 150 KB gzip, CLS 0, Lighthouse thresholds in `lighthouserc.json`.
- Test first: unit for pure logic, Playwright for behaviour, at phone and desktop sizes.
- Look at it: screenshot desktop (1280) and phone (390) in both themes before calling it done.

## Copy voice

Plain, first person, specific. Buttons say what happens ("See my work", "Contact me"). No filler, no selling adjectives.

Patterns that read as generated, removed in issue #531; keep them out:

- No aphorism after a colon or a dash ("every field is a decision"): say the fact.
- No triads or colon-led lists in a sentence ("what I tried, what broke, what I kept"); one or two concrete things read as a person.
- No idioms or stock phrases ("my daily bread", "under the hood").
- No pleonasm with the title (a "Raider" who plays "in raids").
- Claims match what CI enforces: Lighthouse mobile ≥ 95 (`lighthouserc.json`), never "100".
- Typographic punctuation in visible copy, both languages: `’` not `'` (“I’m”, “l’articolo”), `“…”` not `"…"`, `…` not `...`; code spans and code blocks keep ASCII. `scripts/typography.test.mjs` checks the content files, the Italian units and the blog posts (issue #583).
- Rewriting a line for tone keeps every fact it carried (tools, numbers, features); change the phrasing, not the content. Italian is written as Italian, not translated word for word.
