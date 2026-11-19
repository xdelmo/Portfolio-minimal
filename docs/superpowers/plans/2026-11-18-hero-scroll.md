# Hero scroll exit Implementation Plan

Status: written 2026-11-18, not started.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** As the home hero scrolls away, the pixel cloud closes over the clearing with a growing wind, then crumbles together with the hero seam (issue #593).

**Architecture:** Pure threshold functions in `pixel-field/field.ts`; both painters (`render.ts` 2D, `gl.ts` WebGL) apply an `exit` progress at draw time, on top of `frameCells`, using new static arrays per cell (`open`: the depth with no clearing; `close` and `crumble`: its thresholds). `PixelField` listens for a `pixel-field-exit` event on its host and redraws at once; `motion/effects/hero.ts` owns one scrubbed timeline that drives the title, the `.copy` fade, the event and the hero seam's `--p`.

**Tech Stack:** Angular 22 zoneless, GSAP ScrollTrigger, WebGL 1, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-18-hero-scroll-design.md`

## Global Constraints

- Reduced motion: no effect at all; cloud still, text visible.
- Scrubbed tweens: `gsap.set` + `.to()`, `ease: 'none'`.
- The scroll redraws the cloud even while `MotionPause`, the `IntersectionObserver` or a hidden tab stop the loop; at exit 1 the frame is empty.
- Wind shift in whole cells, quantised, so `cellsOf`'s cache sees a handful of new keys per scroll.
- Headline stays the LCP; no new request or chunk; Lighthouse mobile ≥ 0.95; CLS 0.
- Canvas stays `aria-hidden`; axe clean in both themes; the faded `.copy` link stays focusable.
- No green; tokens only.
- Text faded by `CLOSE_START = 0.25`; clearing closed by `CLOSE_END = 0.6`; crumble in `CRUMBLE_STEPS = 8`.

## Review Focus

1. Resize while scrolled half way: `cellsOf` rebuilds and the next frame must keep the current exit, not jump to 0 → test in Task 4 (the stored exit survives a re-render).
2. Theme toggle while scrolled with the loop paused: the repaint must keep the exit → covered by Task 4, render reads `this.frame.exit`.
3. Reduced motion switched on mid-page after scrolling: the effect is reverted, the cloud must return to exit 0 and `.copy` to opacity 1 → Task 5 cleanup dispatches exit 0; e2e in Task 6.
4. Ripples and pointer pull during the exit: a closed cell must still be pulled back by the pointer, a crumbled cell must not be relit by the twinkle wave (only ripples may cross it, as in the clearing) → unit test in Task 2.
5. WebGL and 2D must agree: same thresholds from the same hash → Task 3 ports `closeAt`/`crumbleAt` to GLSL from the same constants; the e2e runs on WebGL, the unit tests on 2D.

---

### Task 1: Pure exit functions

**Files:**
- Modify: `src/app/pixel-field/field.ts`
- Test: `src/app/pixel-field/field.spec.ts`

**Interfaces:**
- Produces:
  - `export const CLOSE_END = 0.6; export const CRUMBLE_STEPS = 8; export const WIND_CELLS = 6;`
  - `export const CLOSE_START = 0.25;` — `.copy` is fully faded by then, so no cell closes over readable text.
  - `closeAt(col: number, row: number): number` — in [CLOSE_START, CLOSE_END), from `hash` of the cell index on a fixed stride (`row * 4099 + col`), so it does not depend on `cols`.
  - `crumbleAt(col: number, row: number, rows: number): number` — in [CLOSE_END, 1), quantised to `CRUMBLE_STEPS`, top rows lowest: `v = min(0.999, 0.7 * row/(rows-1) + 0.3 * hash(...))`, value `CLOSE_END + floor(v * CRUMBLE_STEPS) / CRUMBLE_STEPS * (1 - CLOSE_END)` (the seam's `dissolveThresholds` recipe).
  - `windShift(p: number): number` — `Math.round(WIND_CELLS * p * p)` (whole cells, 0 at 0, non-decreasing).
  - `openDepth(col: number, row: number, shift = 0): number` — the depth the cell would have far from any clearing: move the body of `cloudDepth` after the NaN check into a private `depthAt(col, row, near, shift)`, `cloudDepth` calls it with its `near`, `openDepth` with `near = 1`. It never calls `shapeOf`, whose single-entry module cache would thrash if it were asked for two clearings in turn (agy, 2026-11-18); and `shapeOf` turns `[]` into the default centre box, so "no clearing" cannot be an empty list.
  - `export const CLOSED_MIN = 0.1;` — above `BREATHE` (0.08), so breathing never blinks a closed cell off.
  - `exitDepth(depth: number, open: number, exit: number, close: number, crumble: number): number` — `close`/`crumble` are the cell's `closeAt`/`crumbleAt`. If `depth <= 0 && exit >= close` → `max(open, CLOSED_MIN)` (the sky channels close too, so the closed cloud is whole, with its tones); else `depth`. The crumble is not here: it is applied after breath and pointer (Task 2), so they can never lift a crumbled cell back.

- [ ] **Step 1: Write the failing tests** in `field.spec.ts`:
  - `closeAt` is in [0.25, 0.6) for 2000 cells, and stable across calls.
  - `crumbleAt` is in [0.6, 1), takes at most 8 distinct values, and the mean over row 0 is lower than the mean over the last row.
  - `windShift(0) === 0`, integer for p in steps of 0.05, non-decreasing, `windShift(1) === WIND_CELLS`.
  - `exitDepth(d, o, 0, 0.3, 0.7) === d`; `exitDepth(-0.2, 0.5, 0.6, 0.3, 0.7) === 0.5`; `exitDepth(-0.2, -0.4, 0.6, 0.3, 0.7) === CLOSED_MIN`; `exitDepth(-0.2, 0.5, 0.2, 0.3, 0.7) === -0.2` (not yet).
  - `openDepth` equals `cloudDepth` with clear `null` for a cell far from the default centre box (corner cell, same shift).
- [ ] **Step 2:** `npx ng test --no-watch --include src/app/pixel-field/field.spec.ts` → FAIL (not exported).
- [ ] **Step 3:** Implement the five exports above in `field.ts`, next to `cloudDepth`.
- [ ] **Step 4:** Same command → PASS.
- [ ] **Step 5:** Commit `feat(field): exit thresholds and scroll wind (#593)`.

### Task 2: The 2D painter applies the exit

**Files:**
- Modify: `src/app/pixel-field/render.ts`
- Test: `src/app/pixel-field/render.spec.ts`

**Interfaces:**
- Consumes: Task 1 exports.
- Produces:
  - `FrameState` gains `exit: number` (0 at rest).
  - `Cells` gains `open`, `close`, `crumble` (same array type as `depth`): `openDepth` with the same shift, and the two thresholds, filled in `cellsOf`; the cache key is unchanged.
  - `frameCells` adds `windShift(f.exit)` to `drift(t)` before `cellsOf`.
  - `drawFrame` uses `exitDepth(cells.depth[i], cells.open[i], f.exit, cells.close[i], cells.crumble[i])` as the cell's static depth, then breath and pointer pull as today, then `if (f.exit >= cells.crumble[i]) depth = -1`. A crumbled cell draws only ripple energy (as the clearing does), never the twinkle wave. The compose start keeps reading the unexited `cells.depth[i]` (the exit only runs after the cloud composed; clamped, so -1 is harmless).

- [ ] **Step 1: Failing tests** in `render.spec.ts` (reuse the file's fake context that records fillRects):
  - `exit 0 draws exactly as today` (same rect count as the existing at-rest test).
  - `at exit 0.6 every cell is lit, the padded text box and the sky channels included` (rect count === cols × rows on a composed, still frame).
  - `at exit 1 nothing is drawn` (still frame, no ripples).
  - `between 0.6 and 1 the top row empties before the bottom one` (at exit 0.8, lit cells in row 0 < lit cells in the last row).
  - `a crumbled cell is lit only by a ripple` (exit 1 plus a ripple → some rects, without → none).
- [ ] **Step 2:** `npx ng test --no-watch --include src/app/pixel-field/render.spec.ts` → FAIL.
- [ ] **Step 3:** Implement as in Interfaces; add `exit: 0` everywhere a `FrameState` is built (grep `ripples: \[\]` in `src/`).
- [ ] **Step 4:** Same command, plus `field.spec.ts` → PASS.
- [ ] **Step 5:** Commit `feat(field): the 2D painter closes and crumbles the cloud (#593)`.

### Task 3: The WebGL painter applies the exit

**Files:**
- Modify: `src/app/pixel-field/gl.ts`

**Interfaces:**
- Consumes: `Cells.open`, `Cells.close`, `Cells.crumble`, `FrameState.exit`, `CLOSED_MIN`.
- Produces: the same picture as Task 2 on the GPU.

- [ ] **Step 1:** Change the vertex layout to 9 floats (stride 36): `a_pos` (2), `a_cell` (4), new `attribute vec3 a_exit` = (`cells.open`, `cells.close`, `cells.crumble`), so 2D and GL read the same CPU-computed thresholds (no hash in GLSL).
- [ ] **Step 2:** Shader: `uniform float u_exit;` before breath `if (depth <= 0.0 && u_exit >= a_exit.y) depth = max(a_exit.x, CLOSED_MIN);`, after the pointer pull `if (u_exit >= a_exit.z) depth = -1.0;` (so `cloud` is false and the wave never lights it). The compose `start` keeps `a_cell.x`.
- [ ] **Step 3:** `gl.uniform1f(u.exit, f.exit)` each frame.
- [ ] **Step 4:** `npm run build` then `npx playwright test e2e/pixel-field.spec.ts --project=chromium` → PASS (nothing changed at exit 0; the WebGL test still sees one draw call).
- [ ] **Step 5:** Commit `feat(field): the WebGL painter closes and crumbles the cloud (#593)`.

### Task 4: PixelField takes the exit from the scroll

**Files:**
- Modify: `src/app/pixel-field/pixel-field.ts`
- Test: `src/app/pixel-field/pixel-field.spec.ts`

**Interfaces:**
- Produces: `export const FIELD_EXIT = 'pixel-field-exit';` — a `CustomEvent<number>` dispatched on the `app-pixel-field` host. The handler clamps the detail to [0, 1], stores it in `this.frame.exit`, writes `canvas.dataset['exit'] = exit.toFixed(2)`, and calls `this.render()` only when the loop is stopped (`!this.raf`): while it runs, the next tick paints the new exit, and a second paint per frame would be wasted. Resize and theme repaints read the stored `frame.exit`. Listener added in `start()` on the host element (`inject(ElementRef)`), removed in the cleanups.

- [ ] **Step 1: Failing test** in `pixel-field.spec.ts`: dispatching `new CustomEvent(FIELD_EXIT, { detail: 0.5 })` on the host sets `data-exit="0.50"` on the canvas, and a detail of 2 gives `"1.00"`.
- [ ] **Step 2:** `npx ng test --no-watch --include src/app/pixel-field/pixel-field.spec.ts` → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Same command → PASS.
- [ ] **Step 5:** Commit `feat(field): redraw on the hero's exit progress (#593)`.

### Task 5: The hero timeline

**Files:**
- Modify: `src/app/motion/effects/hero.ts`, `src/app/motion/effects/dissolve.ts`

**Interfaces:**
- Consumes: `FIELD_EXIT`, `CLOSE_START`, `CLOSE_END`.
- Produces: the scrubbed movement.

- [ ] **Step 1:** `dissolve.ts`: the crumble skips the hero seam (`el.matches('.seam--hero')` → no crumble tween; its forming branch never runs since it is above the fold, keep it untouched).
- [ ] **Step 2:** `hero.ts`, replacing the `away` tween: `gsap.set(seam, { '--p': 1 })`, then one `gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }, defaults: { ease: 'none' }, onUpdate })` with:
  - title `.to(title, { yPercent: -18, scale: 1.08, transformOrigin: '0% 100%', duration: 1 }, 0)`;
  - `.to(copy, { opacity: 0, duration: CLOSE_START }, 0)` (plain `opacity`, not `autoAlpha`: the link stays focusable), so the text is gone before the first cell closes;
  - `.to(seam, { '--p': 0, duration: 1 - CLOSE_END }, CLOSE_END)`;
  - `onUpdate` dispatches `new CustomEvent(FIELD_EXIT, { detail: tl.progress() })` on `app-pixel-field`.
- [ ] **Step 3:** Return a cleanup that dispatches detail 0 (reduced motion switched on mid-page, Review Focus 3).
- [ ] **Step 4:** `npx ng test --no-watch` (whole unit suite, a minute) and `npm run lint` → PASS. Commit `feat(motion): the hero closes and crumbles as it scrolls away (#593)`.

### Task 6: E2E, docs, gate

**Files:**
- Create: `e2e/hero-exit.spec.ts`
- Modify: `e2e/seams.spec.ts` (the hero seam now crumbles on the hero's range: check `the … seam crumbles away` loops only over other seams), `docs/superpowers/specs/2026-10-03-portfolio-v2-design.md` (§17 row), `.claude/skills/edm-style/SKILL.md` (motion), `DESIGN.md`, `CLAUDE.md` (motion line: `hero.ts` owns the hero seam's `--p` and the field's exit), the spec's status line.

- [ ] **Step 1:** `hero-exit.spec.ts`, at 1440×900 and 390×844:
  - at the top `data-exit` is `0.00` (or absent) and `.copy` opacity is 1;
  - scrolled to half the hero height, `data-exit` > 0 and `.copy` opacity < 1;
  - scrolled to the hero's bottom, `data-exit` is `1.00`, `.copy` opacity 0 and the hero seam's `--p` 0;
  - back to the top, all three return;
  - with `reducedMotion: 'reduce'`, after scrolling the hero away `.copy` opacity stays 1 and `data-exit` never appears.
  - Use `expect.poll`/`toPass` as the other specs do (scrub catches up over frames).
- [ ] **Step 2:** `npm run build && npx playwright test e2e/hero-exit.spec.ts e2e/seams.spec.ts e2e/pixel-field.spec.ts --project=chromium` → PASS.
- [ ] **Step 3:** Docs as listed; commit `docs: hero scroll exit (#593)`.
- [ ] **Step 4:** `caffeinate -is npm run verify` (exit code 0) and `npm run lhci` (home ≥ 0.95).
- [ ] **Step 5:** Ship with `npm run ship`.
