---
name: edm.
description: Emanuele Del Monte's portfolio, a calm 8px pixel grid with a hidden arcade inside.
colors:
  concrete: "#dedede"
  paper: "#f2f2f2"
  ink: "#1d1d1c"
  ink-muted: "#555555"
  signal-blue: "#0058b8"
  signal-blue-bright: "#0066d4"
  on-signal: "#ffffff"
  night: "#121212"
  slate: "#202020"
  night-ink: "#dedede"
  night-muted: "#aaaaaa"
  night-link: "#4d9bf0"
  pixel-sky: "#7fb2ec"
  pixel-mist: "#b9d5f5"
  pixel-lavender: "#c9b8f5"
  pixel-lilac: "#dccff8"
  pixel-peach: "#ffb88f"
  band-pastel: "#b9d5f5"
  band-lavender: "#dccff8"
  band-ink: "#1d1d1c"
  band-ink-text: "#f2f2f2"
  band-link: "#0b4f96"
  band-pastel-muted: "#2f4560"
  band-lavender-muted: "#4a3d6b"
  band-ink-muted: "#b8b8b2"
  band-ink-link: "#9ccaff"
  scrim: "rgb(0 0 0 / 0.6)"
typography:
  display:
    fontFamily: "Instrument Sans Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.747rem, 1.6rem + 5.2vw, 6rem)"
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: "-0.01em"
    fontVariation: "'wdth' 100"
  poster:
    fontFamily: "Instrument Sans Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(3rem, 1rem + 8vw, 9rem)"
    fontWeight: 600
    lineHeight: 0.95
  statement:
    fontFamily: "Instrument Sans Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.2rem, 1.2rem + 4vw, 3.433rem)"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.01em"
    fontVariation: "'wdth' 75"
  curtain:
    fontFamily: "Instrument Sans Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 10vw, 7rem)"
    fontWeight: 600
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Instrument Sans Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2rem, 1.4rem + 2.5vw, 2.747rem)"
    fontWeight: 600
    lineHeight: 1.1
    fontVariation: "'wdth' 85"
  title:
    fontFamily: "Instrument Sans Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.406rem, 1.1rem + 1.2vw, 1.758rem)"
    fontWeight: 600
    lineHeight: 1.1
    fontVariation: "'wdth' 85"
  voice:
    fontFamily: "Instrument Serif, ui-serif, Georgia, serif"
    fontSize: "1.14em"
    fontWeight: 400
    fontStyle: "italic"
  body:
    fontFamily: "Instrument Sans Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.55
    fontVariation: "'wdth' 100"
  micro:
    fontFamily: "Instrument Sans Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.72rem"
    fontWeight: 600
    lineHeight: 1.3
  label:
    fontFamily: "Instrument Sans Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 600
    lineHeight: 1.55
  code:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
rounded:
  none: "0px"
spacing:
  space-1: "8px"
  space-2: "16px"
  space-3: "24px"
  space-4: "32px"
  space-6: "48px"
  space-8: "64px"
  space-12: "96px"
  space-16: "128px"
components:
  button-primary:
    backgroundColor: "{colors.signal-blue}"
    textColor: "{colors.on-signal}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "0 24px"
    height: "48px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "0 24px"
    height: "48px"
  repo-tag:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 16px"
    height: "40px"
  repo-tag-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.concrete}"
---

# Design System: edm.

The values come from `src/styles/_tokens.scss` and `src/styles/_base.scss`, which stay the source of truth: components read CSS custom properties (`--bg`, `--fg`, `--accent`, …) that the theme switches at runtime, never the hex codes. The living objects and every motion rule are binding in `.claude/skills/edm-style/SKILL.md`; this file carries the tokens and the doctrine that frames them.

## Overview

**Creative North Star: "The Quiet Arcade"**

A sober page, a game inside. What a recruiter meets first is plain and calm: a concrete grey page, ink text in one sans family, one Signal Blue, everything snapped to an 8px grid. Under that surface the site plays: a field of pastel pixels in the hero, a voxel moai that breathes and blows gum, side quests kept like items in an inventory, a player card behind the Konami code. The calm is what makes the play read as craft rather than noise.

Density is low and text-first. Sections alternate with full-bleed bands (pastel, lavender, ink) that change the mood without changing the type. Edges are hard and stepped, never soft: no rounded cards, no blur, no decorative gradients. Boldness is spent on a few named living objects; everything else stays out of their way.

**Key Characteristics:**
- One family, Instrument Sans Variable, with width doing the expressive work (condensed headings, full-width body), plus one italic serif voice, Instrument Serif, for the curious half of a display sentence.
- One accent, Signal Blue, for actions, focus and pixels; pastels only in decoration.
- 8px grid for every space, icon, cell and image size.
- Stepped shapes and `steps()` transitions instead of curves.
- A light and a dark theme, equal in care, both WCAG 2.2 AA.

## Colors

Concrete greys and ink, one saturated blue, and a pastel pixel palette (blue tints, lavender, peach) that never carries text.

### Primary
- **Signal Blue** (`signal-blue`): the one blue of the light theme. `--accent`, `--link`, `--focus` and `--accent-line` all point at it: the primary button's fill, inline links, the focus ring and the thin accent lines (pixel thread, pixel cursor, current inventory slot, blockquote rule). 5.05:1 on concrete, 6.07:1 on paper (issue #462).
- **Bright Signal** (`signal-blue-bright`): the primary button's fill in dark theme and the strongest pixel (`--px-1`) in both themes. Never text on concrete.
- **Night Link** (`night-link`): in dark theme links, the focus ring and `--accent-line`, because the fill blue is too dark to read as a thin line on night.

### Neutral
- **Concrete** (`concrete`) and **Night** (`night`): the page in light and dark.
- **Paper** (`paper`) and **Slate** (`slate`): raised surfaces: project frames, experience cards, inventory slots, panels.
- **Ink** (`ink`) and **Night Ink** (`night-ink`): text; ink is also the border of secondary buttons and tags and the primary button's hard shadow.
- **Ink Muted** (`ink-muted`) and **Night Muted** (`night-muted`): secondary text, dates, captions.

### Decorative pixels
- **Pixel Sky, Mist, Lavender, Lilac, Peach** (`pixel-*`): dots of the hero field, sprites, seams. Brighter variants in dark theme (`--px-1` … `--px-6`).

### Bands
- **Pastel** (`band-pastel`, About), **Lavender** (`band-lavender`, side quests) and **Ink** (`band-ink` with `band-ink-text`, contact and footer) are full-bleed section backgrounds. A band re-points `--fg`, `--fg-muted`, `--link`, `--focus` and `--rule` to its own AA-checked set (`band-link` on the pastel bands; `band-pastel-muted`, `band-lavender-muted`, `band-ink-muted` for secondary text and `band-ink-link` for links on ink), so its content follows by itself. In dark theme the bands turn deep navy and violet.

### Named Rules
**The Highlighter Rule.** Selected text is ink (`#1d1d1c`) on Pixel Peach (`#ffb88f`), about 10:1, in both themes and on every band (`--selection-bg`, `--selection-fg`). Peach is the one pastel no band sits on, so a selection never vanishes into its background.

**The No Green Rule.** No green anywhere: not for success, not in syntax colours, not as a pastel. The brand is greys, the blue family, lavender and peach.

**The Silent Pastel Rule.** The `pixel-*` colours never carry text or a control's state; text on a pastel band uses that band's own ink tokens.

**The Two Themes Rule.** Every new colour ships with a light and a dark value, both checked for AA; a token that is light in one theme can turn black in the other.

## Typography

**Display Font:** Instrument Sans Variable (with ui-sans-serif, system-ui)
**Body Font:** Instrument Sans Variable
**Code Font:** the system monospace (ui-monospace, SFMono-Regular, Menlo, Consolas), only inside code in blog posts

**Character:** One variable family carries the system, with a single italic serif voice for the curious half of a display sentence. Headings are weighty, the body is open and even, so the page reads as one voice at different volumes.

### Hierarchy
- **Display** (600, 44 → 96px fluid, 1.02, `wdth` 100): the hero headline only, the page's main graphic element, at normal width (it no longer widens on scroll).
- **Voice** (Instrument Serif italic, 400, about 1.14× the sans size): the curious half of a display sentence, never a paragraph, label or button. For now the second half of the hero headline ("curious by nature.") and of the About statement ("but always feel."). Loaded latin only, `font-display: optional`, preloaded.
- **Headline** (600, 32 → 44px, 1.1, `wdth` 85): section titles (`h2`).
- **Title** (600, 22.5 → 28px, 1.1, `wdth` 85): project names, card titles, case study subsections (`h3`).
- **Body** (400, 18px, 1.55, `wdth` 100): all running text, never wider than 53ch (about 75 characters a line).
- **Label** (600, 14.4px): repository tags, small meta.
- **Micro** (600, 11.5px / 0.72rem): code tags, small indicators, header name subline.

The scale is modular, 1.25 on 18px (`--step--2` … `--step-5`). Three display roles sit outside it, one use each: **Poster** (48 → 144px, 0.95), the giant contact title; **Statement** (35 → 55px, 1.05, `wdth` 75), the About's sentence lit by the scroll; **Curtain** (40 → 112px), the new language's name on the language switch's panel, white on `signal-blue`.

Prose wraps `pretty` (paragraphs and list items: no word alone on the last line), headings `balance`.

### Named Rules
**The Sentence Case Rule.** Sentence case everywhere. No all-caps labels, eyebrows, monospace metadata, middle-dot meta strings, arrows appended to links, or a single accented word in a headline. Two exceptions: the full name beside the moai mark in the header, in tracked capitals on two lines; and the pixel arrow after the giant contact title, which is the title's own action (it links to LinkedIn), not a decoration on a link.

**The Width Not Weight Rule.** Hierarchy comes from size and the `wdth` axis at weight 600; don't add weights for emphasis. The one second face is the `voice` role: the sans is the method, the italic serif is the curiosity.

## Layout

A left-aligned content column, at most 1200px wide, with a 16px gutter on phones and 32px from 768px. Breakpoints are `md` 768px and `lg` 1024px (`@include bp.up(md)`); pointer effects and pins start at `lg` with hover.

Spacing comes only from the 8px scale (`space-1` … `space-16`). Home sections pad 64px above and below, projects sit 64px apart, and a section followed by a band adds the band's 48px pixel seam. The header is 64px tall on phones and 96px from `md`; anchors land below it. Fluid from 320 to 2560px with no horizontal scroll; decorations may fly in from the edges because the root clips horizontally.

**The Eight Rule.** Every space, icon, cell and image dimension is a multiple of 8px.

## Elevation & Depth

Flat. Depth comes from tonal layering (page, surface, band) and from the living objects, never from shadows. The single shadow in the system is the primary button's hard offset on hover (`4px 4px 0` in ink), a pixel-art lift rather than a soft one. The one overlay is the player card's `scrim`, black at 60% behind the dialog in both themes. Soft round shapes appear only as light, made with radial gradients, never `filter: blur`.

**The Hard Shadow Rule.** No soft drop shadows. A shadow, where one exists, is a solid offset with no blur.

## Shapes

Square corners everywhere (`rounded.none`). Borders are 2px solid ink. Curves are drawn in steps: icons are 8×8 SVGs (brand marks 16×16) with `shape-rendering="crispEdges"` and `fill="currentColor"`; round things are pixel circles, like the 16-cell contact photo mask; seams between bands are crumbling rows of 16px cells.

**The Stepped Edge Rule.** If a shape would be smooth, draw it in pixels instead.

## Components

### Buttons
Blocky and tactile, like keys.
- **Shape:** square corners, 2px border, at least 48px tall, 24px side padding, weight 600.
- **Primary:** Signal Blue fill and border, white text. On hover it lifts 4px up and left onto a hard ink shadow, in two steps (120ms `steps(2)`).
- **Secondary:** transparent with an ink border and ink text.
- **Pressed:** every button gives way 2px down and right, the shadow gone.
- **Focus:** a 3px outline in `--focus`, offset 3px, on every interactive element.

### Repository tags
A hard-edged tag holding the pixel GitHub mark and the repository name.
- **Style:** transparent, 2px ink border, label type, 40px tall (44px on touch screens), 16px side padding.
- **Hover:** the tag inverts to ink with concrete text in two steps; pressed, it gives way 2px like a button.

### Bands
Full-bleed coloured backgrounds behind a section (see Colors). On desktop a band grows from an inset block with a hard clip; its top and bottom meet the page through a seam of crumbling pixels.

### Navigation
A fixed header outside the scrolling content: the moai mark (with the full name in tracked capitals on two lines), the section links (Work, Experience, Blog, and About from 1024px, where the bar has room for it; the phone menu lists them all), the language switch showing its code (`EN`), the single motion pause button, theme toggle and the primary "Contact me" button from 768px (on phones the bar keeps the logo on the left and the menu button on the right; the primary "Contact me" button lives prominently in the phone menu panel, along with the other links and the controls). Control icons are all 16px, two pixels per cell. A link's hover and the current page share one hard 2px underline that draws itself in steps. Theme changes reveal in a circle, the language switch drops a curtain in pixel steps, the menu links scramble; a clicked one settles at once on its word and full underline, so the page change's still picture never freezes it half way (issue #572). A page change slower than 200ms shows a 4px accent bar on the header's bottom edge, creeping in steps until the page arrives.

### The living objects
The hero pixel field, the voxel moai, the tool levels, the pixel thread and seams, the side quest sprites and the Press start player card. They are specified, with their behaviour on desktop, phones and reduced motion, in `.claude/skills/edm-style/SKILL.md`. A new section gets one idea from this family, not a new visual language.

## Do's and Don'ts

### Do:
- **Do** read colours through the CSS custom properties (`--bg`, `--fg`, `--accent`, `--link`, band tokens); never hard-code a hex in a component.
- **Do** keep every space and size on the 8px scale.
- **Do** use `steps()` for state transitions on buttons and tags.
- **Do** let surfaces that cover or uncover the page (language curtain, theme circle, page change) glide on `--ease-cover`; on a page change the header stays put and the new page rises from the bottom edge in 0.5s as a whole sheet (`translate`, not a `clip-path` window) while the old one dims (issue #555). Only the header and the fixed pixel cursor (and its arrow) have a `view-transition-name` (issue #560): a named title would slide across the page.
- **Do** reuse `PixelDissolve`, the seams and the thread before inventing a new transition.
- **Do** put `appDepixelate` on any new photo, and show a project's pixel sprite in the 3:2 frame when it has no screenshot.
- **Do** list things as full-width rows under a 1px rule, with body text and lists within `--measure`.
- **Do** give secondary actions the primary button's 48px height and type size.
- **Do** check every change at 1280px and 390px, in both themes.

### Don't:
- **Don't** use green, anywhere.
- **Don't** use rounded cards, soft drop shadows, blur or gradients as decoration.
- **Don't** set text in a `pixel-*` colour.
- **Don't** use all-caps labels, eyebrows, monospace metadata, middle-dot meta strings or arrows appended to links.
- **Don't** add another typeface or extra weights for emphasis; Instrument Serif italic stays in the voice role, never in a paragraph, label or button.
- **Don't** lay things out as a row of three identical tiles.
- **Don't** let an entrance overshoot (`back.out`, elastic, bounce).
- **Don't** write aphorisms after a colon, triads, idioms, or claims CI does not enforce (see Copy voice in edm-style).
- **Don't** add hover-only behaviour on phones, or block vertical scrolling on anything swipeable.
