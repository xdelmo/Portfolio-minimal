# Portfolio v2 — Piano 9: Un filo di pixel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A pixel thread that ties the home sections together, pixel seams into the coloured bands, a phone layout with its own scroll and touch motion (face first, block-revealed project images, stacked experience cards, tappable stack orbs, swipeable moai) and an About that opens with one big statement.

**Architecture:** One pure function (`dissolveThresholds`) feeds one SVG component (`PixelDissolve`) used three ways: band seams, the hero seam and the veil over project images; GSAP effects in `src/app/motion/effects/` scrub a single CSS variable `--p` on each. The thread is a markup component plus a scrubbed effect. Phone layouts are plain CSS under `bp.up(lg)`; touch behaviour lives in effects (stack) and in `moai-scene.ts`.

**Tech Stack:** Angular 22, GSAP 3.15 + ScrollTrigger + SplitText (lazy chunk), Three.js (moai), Playwright, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-05-portfolio-v2-pixel-thread-design.md`. Style: `.claude/skills/edm-style/SKILL.md`.

## Global Constraints

- WCAG 2.2 AA in both themes; axe already runs on every page in light and dark.
- Reduced motion: no thread, seams and veils in their final state, About words full, no orb pulse. Sticky experience cards stay (layout).
- Initial JS < 150 KB gzip; CLS 0; LHCI thresholds.
- No green. Pointer effects only at `(min-width: 1024px) and (hover: hover)`; phones get scroll/tap versions.
- Every task ends with `npm run verify` exiting 0 (lint, unit, scripts, build, e2e). Local e2e reuses the static server on port 4300.

## Review Focus

1. Content without JavaScript: seams formed, veils absent, words full, thread hidden (nothing hides content before hydration).
2. Phones at 320 px: no horizontal scroll with the thread, seams and orbs.
3. A swipe on the moai never blocks vertical scrolling or pinch-zoom.
4. Sticky experience cards never hide the section title or the next section; desktop deck unchanged.
5. Dark theme: every new colour (thread off nodes, seams, veil, card surface) checked by eye and by axe.

---

### Task 1: PixelDissolve and the seams

**Files:** create `src/app/pixel-dissolve/dissolve.ts` (+ `.spec.ts`), `src/app/pixel-dissolve/pixel-dissolve.ts`, `src/app/motion/effects/dissolve.ts`; modify `src/app/pages/home/home.ts`; test `e2e/seams.spec.ts`.

**Interfaces:**
- `dissolveThresholds(cols: number, rows: number, grow: 'up' | 'none'): Float32Array` — one value in [0, 1) per cell (row-major); with `'up'` the bottom row is lowest on average.
- `<app-pixel-dissolve [cols] [rows] [colors] [grow] />` renders `<svg aria-hidden="true">` with one `<rect>` per cell, `style="--t: …"`, fill `var(<color>)`; host CSS: `rect { opacity: clamp(0, calc((var(--p, 1) - var(--t)) * 6), 1) }`; class `veil` inverts it (`1 - …`).
- `dissolveEffect`: for each `app-pixel-dissolve[data-scrub]` below the fold, `gsap.set(el, {'--p': 0})` then `.to(el, {'--p': 1, ease: 'none', scrollTrigger: {trigger: el, start: 'top bottom', end: 'top 45%', scrub: true}})`.

- [ ] Unit test thresholds: length `cols*rows`; all in [0, 1); same input → same output; `'up'`: mean of last row < mean of first row.
- [ ] Run, watch it fail (module missing).
- [ ] Implement with `hash()` from `pixel-field/field.ts` plus a row bias.
- [ ] E2E `seams.spec.ts`: the About and Contact seams exist; before scrolling to them `--p` < 1, after scrolling past `--p` is 1; with reduced motion `--p` is 1 (unset) from the start; hero seam exists.
- [ ] Watch it fail; build the component, place seams at the top of `#about` and `#contact` (colors: band colour + `--px-*` tints) and at the bottom of the hero (pixel tints); add `dissolveEffect` to the home effects.
- [ ] `npm run verify` exits 0; commit.

### Task 2: The thread

**Files:** create `src/app/layout/thread.ts`, `src/app/motion/effects/thread.ts`; modify `home.ts`; test `e2e/thread.spec.ts`.

- Markup: `<div class="thread" aria-hidden="true"><span class="line"></span></div>` inside a `position: relative` wrapper around the sections after the hero; nodes are added by the effect (one `<i class="node">` per `section[id]` heading, `top` from the heading offset, recomputed on ScrollTrigger refresh).
- Hidden by default (`display: none`); the effect adds `is-on`. Line height `calc(var(--thread, 0) * 100%)`; nodes get `is-lit` when the thread passes them.
- Left: `max(4px, calc(max(var(--gutter), (100% - var(--container)) / 2) - 24px))`.

- [ ] E2E: thread visible after load; at the top only the Work node lit at most; after scrolling to the bottom every node lit and `--thread` ≈ 1; reduced motion: thread hidden; 320 px: `scrollWidth <= innerWidth`.
- [ ] Watch it fail; implement; `npm run verify` exits 0; commit.

### Task 3: Hero and projects on the phone

**Files:** modify `home.ts`, `src/app/sections/work-list/work-list.ts`, `effects/dissolve.ts`; tests in `e2e/layout.spec.ts`, `e2e/seams.spec.ts`.

- Below `lg` the pixel field gets `order: -1` (above the title); hero parallax: the field moves up to 15% with scroll on phones (scrubbed `yPercent`).
- Work list: below `md` the media comes before the text; each project image gets an `app-pixel-dissolve class="veil" data-scrub` (24 × 16 cells, colour `--bg`) over it.
- [ ] E2E: phone — field box above h1; desktop — field to the right of h1; veil covers (`--p` 0) below the fold and is gone (`--p` 1) after scrolling; reduced motion — veil fully transparent.
- [ ] Watch fail; implement; verify; commit.

### Task 4: About

**Files:** modify `content.model.ts`, `content.en.ts`, `content.it.ts`, `home.ts`, `src/app/sections/at-a-glance/at-a-glance.ts`; create `effects/about-words.ts`; tests `content.spec.ts`, `e2e/about.spec.ts`.

- Content: `aboutStatement` — EN "I care about the parts users never see but always feel." IT "Curo le parti che nessuno vede ma tutti sentono."; remove that sentence from `about`.
- Markup: `<p class="statement">` before the paragraph, condensed 600, `clamp(2.2rem, 1.2rem + 4vw, var(--step-5))`.
- Effect: SplitText words; `gsap.set(words, {color: 'var(--fg-muted)'})`, `.to(..., {color: 'var(--fg)', stagger: 0.1, scrollTrigger: {trigger, start: 'top 80%', end: 'bottom 40%', scrub: true}})`; revert restores the text.
- Glance: no surface card; values `--step-1` 600, labels `--step--1` muted; 2 columns, 3 from `md`; `border-top: 1px solid var(--rule)` per item.
- [ ] Unit: both locales have a non-empty `aboutStatement` that is not repeated inside `about`.
- [ ] E2E: statement visible; after scrolling past it every word has the `--fg` colour; reduced motion — single text node, full colour; glance background transparent.
- [ ] Watch fail; implement; verify; commit.

### Task 5: Experience as stacked cards on phones

**Files:** modify `src/app/sections/experience-timeline/experience-timeline.ts`, `effects/experience.ts` (drop the phone fade); test `e2e/motion.spec.ts`.

- Below `lg`: `li { position: sticky; top: calc(var(--header-h) + var(--space-2) + var(--i) * 8px); background: var(--surface); border: 1px solid var(--rule); padding: var(--space-3) }`, `--i` set per item in the template.
- [ ] E2E: phone — items computed `position: sticky`, increasing `top`; desktop — not sticky; the next section title is not covered after scrolling past (its box not intersecting the last card).
- [ ] Watch fail; implement; verify; commit.

### Task 6: Stack on phones

**Files:** modify `src/app/sections/stack-list/stack-list.ts`; create `effects/stack-tap.ts`; test `e2e/motion.spec.ts`.

- Title above orbs: the section heading `position: relative; z-index: 1`.
- Tap: `pointerdown` on an `.orb` → `gsap` stepped pulse (scale 1 → 1.15 → 1, `steps(3)`), the matching `.group` gets `is-picked` for 1.6 s (outline `--accent` 2 px, offset 8 px). Orb ↔ group by index.
- [ ] E2E: phone — tapping the first orb sets `is-picked` on the first group, gone after 2 s; heading z-index above the orbs.
- [ ] Watch fail; implement; verify; commit.

### Task 7: Swipe the moai

**Files:** modify `src/app/voxel/moai-scene.ts`; test `e2e/moai.spec.ts`.

- Canvas `touch-action: pan-y pinch-zoom`; `onDown`/`onMove` accept `pointerType === 'touch'` on phones (horizontal delta adds to `drag`); desktop mouse drag unchanged.
- [ ] E2E (mobile project): a horizontal swipe changes the canvas; touch-action is `pan-y pinch-zoom`; update the old "never blocks scrolling" test to accept it.
- [ ] Watch fail; implement; verify; commit.

### Task 8: Close

- Docs: main spec §17 rows, README, CLAUDE.md, edm-style skill (thread, seams, veil as new living objects).
- `npm run verify` exits 0; `npm run lhci`; push `v2`; CI green.
- Final review (fresh reviewer, most capable model) with this Review Focus; one fix pass; push; CI green.
