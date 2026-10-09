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
| Page | `--bg` | `#e5e5e5` concrete | `#121212` night |
| Surface | `--surface` | `#f2f2f2` paper | `#1c1c1c` slate |
| Text | `--fg` | `#1d1d1c` ink | white 87% |
| Secondary text | `--fg-muted` | `#555` | `#aaa` |
| Accent (buttons, focus, pixels) | `--accent` | `#0066d4` | `#0066d4` |
| Links | `--link` | `#005fc5` | `#4d9bf0` |
| Pixel palette, decoration only | `--px-1`…`--px-6` | blue, blue tints, lavender ×2, peach | brighter versions |
| Moai | `--stone*`, `--moai-eye-white` | warm greys | darker greys |

- **No green, ever** (the user's brand is greys, the blue family, lavender, peach). This includes "success" states and syntax colours.
- The `--px-*` colours never carry text. Text on pastel uses the band ink tokens (`--band-pastel-*`).
- Sections change mood through **bands** (`.band--pastel` for About, `.band--lavender` for the side quests, `.band--ink` for the contact finale and footer); on the home page plain sections and bands alternate; a band re-points `--fg`, `--link`, `--focus`, `--rule`, so the contents follow by themselves.

## Type

- One family: **Instrument Sans Variable** (`wght` 400–700, `wdth` 75–100), self-hosted with `font-display: optional` (keeps CLS 0; do not switch to the package CSS).
- Headings weight 600: `h1` at `wdth` 75 (condensed, the hero's graphic element), `h2`/`h3` at `wdth` 85; body at `wdth` 100, 18px, line-height 1.55, max 68ch.
- Modular scale 1.25 on 18px: `--step--1` … `--step-5`, `--step-hero` fluid 44→96px. Contact title is the one oversized exception (up to 9rem).
- Sentence case everywhere (one exception the user asked for: the full name in the header, tracked capitals on two lines beside the `edm.` mark, like a letterhead). **No** all-caps labels, eyebrow labels, monospace metadata, middle-dot meta strings, arrows appended to links, or a single accented word in a headline.

## Grid and shape

- Spacing only from `--space-1` (8px) … `--space-16` (128px). Home sections pad 64px above and below; projects sit 64px apart. Sizes of icons, cells and images are multiples of 8.
- Vertical rhythm: 64px (`--space-8`) from a section's edge to its title and from its last line to what follows; a section followed by a band adds the band's 48px pixel seam (`home.ts`, `.section:has(+ .band > .seam)`). Pinned blocks keep their own height (a pin stretched to the screen leaves its spare room on the page once it ends).
- Content column left-aligned, max 1200px, gutter 16px (32px from md). Breakpoints through `@use 'styles/breakpoints' as bp; @include bp.up(md)`.
- No rounded cards, no soft drop shadows, no gradients as decoration. Hard edges; the only shadow is the primary button's hard 4px offset on hover.
- **Stepped shapes instead of smooth ones**: icons are 8×8 SVGs (brand marks 16×16: `github-mark.ts`, `linkedin-mark.ts`) with `shape-rendering="crispEdges"` and `fill="currentColor"`; round things are pixel circles (see the contact photo mask, 16 cells across); transitions use `steps()` where they suit (buttons, the language curtain).
- Soft round things are allowed only as **light**: the glow inside the tool rings and the ambient layer (radial gradients, no `filter: blur`).

## The living objects (where the boldness goes)

Spend boldness here, keep everything else calm:

1. **Hero pixel field** — an abstract field of pastel dots, no figure (the pixel face was removed on request): full-bleed behind the hero text on desktop (masked to 35% under the text column), a band above the title on phones; dots fly in, twinkle, step away from the pointer, ripple on tap.
2. **Voxel moai** (About) — Three.js, breathes, turns towards the viewer as its section scrolls by, turns its head to the mouse; on phones it glances slowly around with pauses (never a spin on itself, removed on request), pixel pupils follow the cursor (no exit animation: the burst into cubes was removed on request); a double click or double tap blows a bubble of pink gum (`--gum`) from its lips that pops by itself.
3. **Tool rings** (`sections/stack-list/`) — the tools by level as concentric rings, every day in the middle, in production around it, side projects outside; the tools are tags on the rings and the rings turn into place on scroll. On phones the levels are rows that step right, with a pixel meter (3, 2, 1 cells) for the depth. The circle is the information, not a decoration (the orbs it replaced only repeated the category names).
4. **Ambient orbs** behind every page, tinted per section, never lowering text contrast.
5. **The pixel thread** (home): an accent line down the left margin, a node per section lit as the scroll reaches it; **seams** of crumbling pixels where a band meets the page, and at the foot of the hero: they form as they scroll in and crumble away as they rise towards the header. Both are `PixelDissolve` (stepped SVG layers driven by one `--p`) or the thread effect; reuse them before inventing a new transition.
6. **Side quest sprites**: each side quest is an item in a game inventory, a 16 × 16 pixel drawing (`sections/side-quests/sprites.ts`) in a hard square slot; it builds itself from the bottom as it scrolls in and hops in steps on hover, focus or tap.
7. **Press start** (`src/app/game/`): the Konami code, five taps on the logo or the small "Press start" key in the footer open a player card in the ink band's colours, with pixel achievements drawn like the side quest sprites; a hidden reward, never in the way.
8. Transitions answering the user: theme circle reveal, language curtain in pixel steps, menu scramble, pixel cursor and magnetic targets. Near a section `h2` the pixel cursor becomes a pixel arrow pointing at the title's words (`motion/arrow.ts`): drawn as lines on 8px cells, in eight directions only, because in between it smudges; never over the words themselves.

Projects without a screenshot show their pixel sprite in the same 3:2 frame as the screenshots (`Project.sprite`).

A new section gets **one** idea in this family, not a new visual language.

## Motion rules

- GSAP via the lazy `MOTION_LOADER`; effects live in `src/app/motion/effects/`, run by `[appMotion]` inside `gsap.matchMedia`, return a cleanup.
- `prefers-reduced-motion: reduce` → no effects at all, still images, no pause button.
- Pointer effects only at `(min-width: 1024px) and (hover: hover)`. Phones get their own motion (scroll and tap driven), never hover-only behaviour.
- Anything automatic that lasts more than 5s stops with the single header pause button (`MotionPause`, `watchPause()` for GSAP).
- Use `gsap.set` + `.to()` for scrubbed tweens; move elements GSAP also transforms through CSS `translate` variables (`--mx/--my`, `--fy/--rx/--ry`).
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
