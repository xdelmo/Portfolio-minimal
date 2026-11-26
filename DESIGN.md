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
    fontSize: "clamp(2.747rem, 5.3vw, 6rem)"
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

<!-- impeccable:design-map -->
Name: edm.
Colors: primary: signal-blue #0058b8; secondary: band-pastel #b9d5f5; tertiary: pixel-sky #7fb2ec; neutral: concrete #dedede; primary: signal-blue-bright #0066d4; primary: on-signal #ffffff (+21 more in the sidecar)
Fonts: Instrument Sans Variable (display, poster, statement, curtain, headline, title, body, micro, label); Instrument Serif (voice); ui-monospace (code)
Spacing: space-1 8px, space-2 16px, space-3 24px, space-4 32px, space-6 48px, space-8 64px, space-12 96px, space-16 128px
Radius: none 0px
North Star: "The Quiet Arcade"
Rules:
- The Highlighter Rule. Selected text is ink (`#1d1d1c`) on Pixel Peach (`#ffb88f`), about 10:1, in both themes and on every band (`--selection-bg`, `--selection-fg`).
- The No Green Rule. No green anywhere: not for success, not in syntax colours, not as a pastel.
- The Silent Pastel Rule. The `pixel-*` colours never carry text or a control's state; text on a pastel band uses that band's own ink tokens.
- The Two Themes Rule. Every new colour ships with a light and a dark value, both checked for AA; a token that is light in one theme can turn black in the other.
- The Sentence Case Rule. Sentence case everywhere.
- The Width Not Weight Rule. Hierarchy comes from size and the `wdth` axis at weight 600; don't add weights for emphasis.
- (+3 more)
Don't:
- Don't use green, anywhere.
- Don't use rounded cards, soft drop shadows, blur or gradients as decoration.
- Don't set text in a `pixel-*` colour.
- Don't use all-caps labels, eyebrows, monospace metadata, middle-dot meta strings or arrows appended to links.
- Don't add another typeface or extra weights for emphasis; Instrument Serif italic stays in the voice role, never in a paragraph, label or button.
- Don't lay things out as a row of three identical tiles.
- Don't let an entrance overshoot (`back.out`, elastic, bounce).
- Don't write aphorisms after a colon, triads, idioms, or claims CI does not enforce (see Copy voice in edm-style).
- Don't type straight apostrophes or quotes in visible copy: `’` and `“…”` (issue #583).
- Don't add hover-only behaviour on phones, or block vertical scrolling on anything swipeable.
Map: src/styles/_tokens.scss
Map: src/styles/_base.scss
Map: .claude/skills/edm-style/SKILL.md
Full: .impeccable/design-full.md (read a section when you need its detail)
