# Hero cloud and two-voice type Implementation Plan

Status: to do (written 2026-11-07, issue #304).

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the home hero into a pixel cloud around a clearing that holds a two-voice headline, and carry the two voices (Instrument Sans at normal width, Instrument Serif italic for the "curious" half) across the site.

**Architecture:** The cloud is the existing `PixelField` with its vignette replaced by a cloud mask computed from the text block's box (pure functions in `pixel-field/field.ts`, drawn by both renderers, `gl.ts` and `render.ts`). The headline's italic tail comes from a `voice` string in the content files that must be a suffix of the sentence, split by one pure helper. Fonts stay self-hosted with `font-display: optional`; `scripts/postbuild.mjs` preloads the serif only on pages that use it.

**Tech Stack:** Angular 22 (standalone, zoneless, signals), WebGL / canvas 2D, GSAP (ScrollTrigger, SplitText), Vitest, Playwright, `@fontsource/instrument-serif`, `@fontsource-variable/instrument-sans`.

**Spec:** `docs/superpowers/specs/2026-11-07-hero-cloud-design.md`

## Global Constraints

- Node 24: prefix commands with `export PATH="$HOME/.local/node/current/bin:$PATH";`.
- The hero headline (text) stays the LCP and paints before the cloud; Lighthouse mobile performance ≥ 0.95 (`npm run lhci`), CLS 0.
- WCAG 2.2 AA in both themes and both languages; axe clean (`e2e/pages.spec.ts`). Hero text sits on the clearing, never on pixels.
- Colours only from tokens (`--px-1`…`--px-6`, `--bg`, `--fg`); no green.
- Pixels keep `CELL` 12 and `DOT` 8.
- Reduced motion: still cloud, no breathing, no ripples; `MotionPause` stops the breathing.
- Copy unchanged. Content in `src/app/content/content.{en,it}.ts`; UI strings through `@angular/localize`, Italian added by hand to `src/locale/messages.it.xlf` after `npm run i18n:extract`.
- Instrument Serif italic only in: hero tail, About statement tail, the 404's "wild"/"selvatico". Never at body size, never in labels or buttons.
- Every heading at `wdth` 100. No third family.
- One `<h1>` per page; the split headline is still one heading read as one sentence.
- While iterating run one spec on Chromium (`npx playwright test e2e/<spec> --project=chromium`) and one unit file; `npm run verify` (in `caffeinate -is` on the Mac) and `npm run e2e:webkit` once at the end of each milestone. Never two suites at once.

## Review Focus

1. **A resize or font swap changes the text block's height** (fallback font under `font-display: optional`, a phone rotated): the clearing must follow the text, never leave text over pixels. Pinned in Task 2 (the field observes the copy's size) and Task 2's e2e.
2. **Dark theme**: the cloud near the text must not be speckled; the clearing edge stays clean. Pinned by `cloudDepth`'s unit test (no lit cell inside the padded box) and the e2e screenshot-free check of Task 2 in both themes.
3. **English text wraps differently** ("Engineer by method," is shorter, "I care about the parts users never see" longer): the voice split must hold in both locales. Pinned by the content test of Task 3.
4. **A visitor whose browser misses the serif** (preload late, `optional` keeps the fallback): the tail must still read as italic and keep the layout. Pinned in Task 4 (fallback stack ends in `serif` with `font-style: italic`).
5. **Konami / tap on phones**: ripples still cross the cloud and still run with the new palette of six tones. Pinned in Task 1 (`gl.ts` and `render.ts` read six tones) and the existing `e2e/game.spec.ts`.

---

## Milestone 1: the hero (one pull request, `feat/304-hero-cloud`)

### Task 1: The cloud mask in the field maths and both renderers

**Files:**
- Modify: `src/app/pixel-field/field.ts` (replace `vignette`)
- Modify: `src/app/pixel-field/render.ts` (`Palette`, `readPalette`, `cellsOf`, `drawFrame`)
- Modify: `src/app/pixel-field/gl.ts` (shader attributes and uniforms)
- Modify: `src/styles/_tokens.scss` (add `--cloud-alpha`: light `1`, dark `0.78`)
- Test: `src/app/pixel-field/field.spec.ts`, `src/app/pixel-field/render.spec.ts`

**Interfaces:**
- Produces:
  - `export interface Box { x: number; y: number; w: number; h: number }` (CSS px, relative to the canvas) in `field.ts`.
  - `export const CLEAR_PAD = 2;` (cells of empty margin around the text box).
  - `export function cloudDepth(col: number, row: number, l: FieldLayout, clear: Box | null): number`: `≤ 0` inside the clearing (the ellipse around `clear` grown by `CLEAR_PAD` cells), rising to `1` towards the hero's edges, its edge roughened by value noise built on `hash`. `clear === null` (not measured yet) uses a centred box half the canvas wide and tall, so nothing lands on the centre.
  - `export function breathe(depth: number, phase: number, t: number): number`: `depth` plus a slow drift of at most `0.08` (period ≥ 6 s); returns `depth` unchanged when `t` is frozen.
  - `export function tone(depth: number, shade: number): number`: index into six tones: `depth > 0.75 → 0` (`--px-1`), `> 0.5 → 1`, `> 0.3 → 2`, otherwise `3` or `4` (lavender) and `5` (peach) when `shade > 0.85`.
  - `Palette` becomes `{ dot: string; tones: readonly string[]; alpha: number }`, `tones` read from `--px-1`…`--px-6`, `alpha` from `--cloud-alpha`.
  - `PixelField`'s renderers take `clear: Box | null` through `FrameState` (`clear: Box | null` added).

- [ ] **Step 1: Write the failing tests** in `field.spec.ts`:
  - `cloudDepth leaves the padded clearing empty`: for a 100×60 layout and `clear = { x: 400, y: 240, w: 400, h: 240 }`, every cell whose centre lies in the box grown by `CLEAR_PAD * CELL` has `cloudDepth ≤ 0`.
  - `cloudDepth is deepest at the hero's corners`: `cloudDepth(0, 0, …) > 0.75` and the four corners all `> 0.75`.
  - `cloudDepth is deterministic`: same inputs, same value.
  - `breathe drifts at most 0.08`: for 200 sampled `t`, `|breathe(0.5, p, t) - 0.5| ≤ 0.08`.
  - `tone maps depth to the six tones`: `tone(0.9, 0) === 0`, `tone(0.6, 0) === 1`, `tone(0.4, 0) === 2`, `tone(0.1, 0.9) === 5`, `tone(0.1, 0.2)` is `3` or `4`.
  - Delete the `vignette` tests.
  In `render.spec.ts`, replace the vignette alpha assertion with: a cell inside the clearing draws nothing at rest (alpha 0 with no energy), a cloud cell draws at `palette.alpha` with `palette.tones[tone(…)]`.
- [ ] **Step 2: Run** `npx ng test --no-watch --include src/app/pixel-field/field.spec.ts` and `--include src/app/pixel-field/render.spec.ts`. Expected: FAIL (`cloudDepth` not exported).
- [ ] **Step 3: Implement** the functions above in `field.ts`; `cellsOf(l, clear)` caches per layout *and* clear box (key on a string of the box, or recompute when the box changes); `drawFrame` uses `breathe(depth, phase, t)` for depth, `tone` for colour, alpha `palette.alpha` for cloud cells and `energy` alone for clearing cells (ripples still flash through); compose-in: at `t = 0` no cloud cell is drawn, by `t = COMPOSE_MS` every cloud cell is full size, outer cells first. Port the same maths to the `gl.ts` vertex shader: `a_cell` carries static depth, phase, shade; `u_lit[5]` becomes `u_tones[6]`; add `u_alpha`.
- [ ] **Step 4: Run** both unit files. Expected: PASS. Then `npm run lint`.
- [ ] **Step 5: Commit** `feat: the hero field draws a pixel cloud around a clearing (#304)`.

### Task 2: The hero layout, the clearing box and the field's e2e

**Files:**
- Modify: `src/app/pixel-field/pixel-field.ts` (input `clear`)
- Modify: `src/app/pages/home/home.ts` (hero template and styles)
- Test: `e2e/pixel-field.spec.ts`, `e2e/layout.spec.ts`

**Interfaces:**
- Consumes: `Box`, `FrameState.clear` from Task 1.
- Produces: `PixelField` input `clear = input<HTMLElement | null>(null)`; the home wraps headline, lede and actions in `<div class="copy" #copy>` and renders `<app-pixel-field class="field" [clear]="copy" />`.

- [ ] **Step 1: Write the failing e2e** in `e2e/pixel-field.spec.ts`:
  - Replace `it is masked to fade out towards the edges (issue #287)` with `the cloud fills the hero without a mask`: `.hero .field` has computed `mask-image` `none` and the same box as `.hero`.
  - `the clearing follows the text block`: read the box the field uses (expose it as `data-clear` on the canvas, `"x,y,w,h"` rounded) and assert it contains `.hero .copy`'s box relative to the canvas, at 1440×900 and 390×844, and again after `page.setViewportSize` to 1024×768.
  - Keep every other test; update the reduced-motion one so the still picture is the cloud (draw count stays 1).
- [ ] **Step 2: Run** `npx playwright test e2e/pixel-field.spec.ts --project=chromium` after `npm run build`. Expected: the new tests FAIL.
- [ ] **Step 3: Implement**: in `PixelField.start()` observe the `clear` element with the same `ResizeObserver` and store its box relative to the canvas in `frame.clear`, set `data-clear`; in `home.ts` drop the field's `mask-image` and its `height` override, keep `inset: 0; z-index: -1`, keep the `.copy` block centred with the current gaps; the clearing's colour is the page `--bg` (the canvas is transparent there).
- [ ] **Step 4: Run** the spec again, then `npx playwright test e2e/layout.spec.ts e2e/game.spec.ts --project=chromium`. Expected: PASS.
- [ ] **Step 5: Commit** `feat: the cloud's clearing follows the hero text (#304)`.

### Task 3: The two-voice headline

**Files:**
- Create: `src/app/content/voices.ts`, `src/app/content/voices.spec.ts`
- Modify: `src/app/content/content.model.ts:131` (`hero: { headline: string; voice: string; lede: string }`, and `aboutVoice: string` next to `aboutStatement`)
- Modify: `src/app/content/content.en.ts`, `src/app/content/content.it.ts`
- Modify: `src/app/pages/home/home.ts` (h1 and `.statement` markup)
- Modify: `src/app/motion/effects/hero.ts` (drop `widest` and the `wdth` tween)
- Test: `e2e/motion.spec.ts`

**Interfaces:**
- Produces: `export function voices(text: string, voice: string): [string, string]` returns `[text without the tail, trimmed end; voice]`; throws `Error('voice must end the sentence')` when `text` does not end with `voice`.
- Content values: IT `voice: 'curioso per natura.'`, EN `voice: 'curious by nature.'`; IT `aboutVoice: 'ma tutti sentono.'`, EN `aboutVoice: 'but always feel.'`. `headline` and `aboutStatement` stay the full sentences (read by `scripts/og-images.mjs`, `scripts/geo-files.mjs`).
- Markup: `<h1 id="hero-title"><span class="method">{{ head[0] }}</span> <span class="voice">{{ head[1] }}</span></h1>` (the space between the spans keeps the sentence whole for screen readers and copy); same pattern inside `.statement`.

- [ ] **Step 1: Write the failing tests** in `voices.spec.ts`: `voices('Engineer by method, curious by nature.', 'curious by nature.')` returns `['Engineer by method,', 'curious by nature.']`; a mismatched voice throws; and for both `CONTENT_EN` and `CONTENT_IT`, `voices(c.hero.headline, c.hero.voice)` and `voices(c.aboutStatement, c.aboutVoice)` do not throw.
  In `e2e/motion.spec.ts` replace `on desktop the condensed headline widens…` with `the headline keeps its normal width while it scrolls away`: computed `font-variation-settings` of `.hero h1` contains `"wdth" 100` before and after scrolling 400px. Keep `the headline rises line by line and ends as plain text`.
- [ ] **Step 2: Run** `npx ng test --no-watch --include src/app/content/voices.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** `voices`, the content fields, the markup (`.method` display block, `.voice` display block on the hero; inline in the statement so the About keeps its balanced wrap), `.hero h1` at `font-variation-settings: 'wdth' 100` without `--hero-wdth`, and remove `widest` and the wdth tween from `hero.ts` (keep the entrance and the drift; SplitText `lines` still works on the two spans). Check `about-words.ts` still lights every word with the nested spans.
- [ ] **Step 4: Run** the unit file, `npx playwright test e2e/motion.spec.ts e2e/smooth-scroll.spec.ts --project=chromium` after a build. Expected: PASS.
- [ ] **Step 5: Commit** `feat: the headline and the About statement speak in two voices (#304)`.

### Task 4: Instrument Serif italic, loaded and preloaded

**Files:**
- Modify: `package.json` (add `@fontsource/instrument-serif` `^5.3.0`)
- Modify: `src/styles/_fonts.scss`, `src/styles/_tokens.scss` (`--font-voice: 'Instrument Serif', ui-serif, Georgia, serif;`)
- Modify: `src/styles/_base.scss` (`.voice { font-family: var(--font-voice); font-style: italic; font-weight: 400; font-size: 1.14em; letter-spacing: -0.01em; font-variation-settings: normal; }`)
- Modify: `scripts/postbuild.mjs` (preload the serif on pages that contain `class="voice"`)
- Test: `scripts/postbuild.test.mjs`, `e2e/motion.spec.ts`

**Interfaces:**
- Consumes: `.voice` markup from Task 3.
- Produces: `@font-face` `'Instrument Serif'`, `font-style: italic`, `font-display: optional`, latin subset only (`instrument-serif-latin-400-italic.woff2`, the same `unicode-range` as the sans' latin block).

- [ ] **Step 1: Write the failing tests**: in `postbuild.test.mjs`, `preloads the serif only where a voice is used`: the function that decides the preloads returns both fonts for an html containing `class="voice"` and only the sans otherwise. In `e2e/motion.spec.ts`: `the curious half is the italic serif`: `.hero h1 .voice` computed `font-style` is `italic` and `font-family` starts with `"Instrument Serif"`; the home's `<head>` has a preload whose `href` matches `instrument-serif-latin-400-italic`.
- [ ] **Step 2: Run** `npm run test:scripts` and the e2e spec. Expected: FAIL.
- [ ] **Step 3: Implement**: install with `npm install @fontsource/instrument-serif@^5.3.0`, declare the face, find the hashed file in `<locale>/media` the way the sans is found, preload it where needed. `scripts/security-headers.mjs` needs no change (same origin).
- [ ] **Step 4: Run** the script tests, `npm run build`, the e2e spec, `e2e/csp.spec.ts` and `e2e/scroll.spec.ts` (the anchor test waits for the headline font). Expected: PASS.
- [ ] **Step 5: Commit** `feat: Instrument Serif italic for the curious half, preloaded where used (#304)`.

### Task 5: Close milestone 1

**Files:**
- Modify: `DESIGN.md` (typography: `voice` role, headings `wdth` 100 for the hero), `.claude/skills/edm-style/SKILL.md` (hero cloud, voice rule)
- Modify: `docs/superpowers/specs/2026-10-03-portfolio-v2-design.md` §17 (one row, text from the spec's "Spec log")
- Modify: `.impeccable/config.json` (suppress `italic-serif-display` for `src/app/pages/home/home.ts` only: `impeccable hooks ignore-value italic-serif-display "*" --file src/app/pages/home/home.ts --reason "user confirmed 2026-11-07: half-italic split headline, issue #304"`), and drop the entries for `.superpowers/brainstorm/…`

- [ ] **Step 1:** `npm run og:images` only if `git diff` shows a headline string changed (it should not); expect no diff.
- [ ] **Step 2:** `caffeinate -is npm run verify`. Expected: exit code 0.
- [ ] **Step 3:** `npm run e2e:webkit`. Expected: exit code 0.
- [ ] **Step 4:** `npm run lhci`. Expected: performance ≥ 0.95 on the home in both locales; if not, measure without the serif preload before changing anything else.
- [ ] **Step 5:** Commit `docs: the hero cloud in DESIGN.md, edm-style and the spec log (#304)`, push, `gh pr create --base devel`, `gh pr checks --watch --fail-fast`, merge with `gh pr merge --rebase --delete-branch` only on exit 0.

---

## Milestone 2: the two voices across the site (branch `feat/304-type-voices`, off `master` after `git fetch` per the repo rule and rebased on `devel` once milestone 1 has merged; PR into `devel`)

### Task 6: Every heading at normal width

**Files:**
- Modify: `src/styles/_base.scss:38-52` (h1, h2, h3 → `'wdth' 100`)
- Modify: `src/app/sections/at-a-glance/at-a-glance.ts:43`, `src/app/layout/site-menu.ts:116`, `src/app/pages/case-study/case-study.ts:240`, `src/app/pages/blog/article.ts:132`, `src/app/pages/not-found/not-found.ts:152`, `src/app/pages/home/home.ts` (`.statement`), `src/app/layout/site-intro.ts` if it sets a `wdth`; leave `src/app/game/player-card.ts` (game UI, not a heading)
- Modify: `src/styles/_fonts.scss` (`font-stretch: 100%` is enough if nothing uses 75–85 any more; keep the range if the intro still does)
- Test: create `e2e/type.spec.ts`

**Interfaces:**
- Produces: `e2e/type.spec.ts` with a helper `headingWidths(page): Promise<string[]>` returning the computed `font-variation-settings` of every `h1, h2, h3, .statement`.

- [ ] **Step 1: Write the failing test** `every heading is at normal width`: on `/en/`, `/it/`, a case study (`/en/work/apexflow/`), the blog index, one post and the 404, every value from `headingWidths` contains `"wdth" 100`.
- [ ] **Step 2: Run** `npx playwright test e2e/type.spec.ts --project=chromium` after a build. Expected: FAIL.
- [ ] **Step 3: Implement** the width changes. Then `grep -rn "wdth\|fontVariationSettings\|font-variation" e2e src` and fix any test or comment that still expects 75/85; check headings that now wrap onto more lines on a 390px phone (`e2e/layout.spec.ts` keeps titles below the headline size and small text ≥ 14px).
- [ ] **Step 4: Run** `e2e/type.spec.ts`, `e2e/layout.spec.ts`, `e2e/stack-levels.spec.ts`, `e2e/menu.spec.ts`. Expected: PASS.
- [ ] **Step 5: Commit** `style: every heading at normal width, the condensed look goes (#304)`.

### Task 7: The 404's wild word and the blog's real italic

**Files:**
- Modify: `src/app/pages/not-found/not-found.ts:28` (`<h1 … i18n="@@notFound.title">A <span class="voice">wild</span> 404 appeared!</h1>`)
- Modify: `src/locale/messages.it.xlf` (target `È apparso un 404 <x id="START_TAG_SPAN" …/>selvatico<x id="CLOSE_TAG_SPAN" …/>!` with the placeholders `npm run i18n:extract` writes)
- Modify: `src/styles/_fonts.scss` (Instrument Sans italic face: `instrument-sans-latin-wdth-italic.woff2`, `font-style: italic`, `font-display: optional`, no preload)
- Test: `e2e/type.spec.ts`, `e2e/pages.spec.ts`

**Interfaces:**
- Consumes: `.voice` styles from Task 4; `headingWidths` from Task 6.

- [ ] **Step 1: Write the failing tests** in `e2e/type.spec.ts`: `the 404's wild word is the italic serif` (`.voice` inside the 404 `h1` is italic `Instrument Serif` in both locales, text `wild` / `selvatico`); `blog emphasis is a real italic`: on a post with `<em>`, after `document.fonts.ready`, `document.fonts.check('italic 18px "Instrument Sans Variable"')` is true and the face's status is `loaded`. Update the 404 title assertions in `e2e/pages.spec.ts` only if they match on markup rather than text.
- [ ] **Step 2: Run** the specs. Expected: FAIL.
- [ ] **Step 3: Implement** the markup, the translation, the italic face; check the postbuild preload of Task 4 adds the serif to the 404 pages too (they contain `class="voice"`).
- [ ] **Step 4: Run** `e2e/type.spec.ts`, `e2e/pages.spec.ts` (axe in both themes). Expected: PASS.
- [ ] **Step 5: Commit** `feat: a wild serif in the 404 and a real italic in the blog (#304)`.

### Task 8: Close milestone 2

- [ ] **Step 1:** Update `DESIGN.md` typography (all heading roles `wdth` 100, `voice` role's three uses, italic sans for prose) and `edm-style`; add the §17 row's second half if Task 5 wrote only the hero.
- [ ] **Step 2:** `caffeinate -is npm run verify` (exit 0), `npm run e2e:webkit` (exit 0), `npm run lhci` (≥ 0.95).
- [ ] **Step 3:** Commit `docs: the two voices in DESIGN.md and edm-style (#304)`, push, PR into `devel`, watch the checks, merge on green. Close #304 when the `devel` → `master` pull request merges.
