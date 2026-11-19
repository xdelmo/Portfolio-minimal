# Hero: the cloud closes and crumbles on scroll (issue #593)

Status: built on branch `feat/593-hero-scroll` (2026-11-19). Rulings: the field's exit arrives as a `FIELD_EXIT` event on its host (not a method), and the constant lives in `pixel-field/field.ts`.

## Why

Scrolling down, the home hero barely reacts: the headline drifts up 18% and grows 8% (`motion/effects/hero.ts`), the pixel cloud of issue #304 stays as it is, and the seam at the hero's foot crumbles on its own range (`effects/dissolve.ts`, top 30% → 10%). The owner wants the hero to animate as it leaves, looking at the reference sites every time.

References studied on 2026-11-18 (agy, read from the sites' code where possible):

- craft.wild.as (verified in its script): the headline scrolls away normally; the full-screen pixel canvas decays cell by cell as the hero leaves the viewport.
- marimba.design (verified in `main.js`): the hero is pinned and its elements rotate, scale and fade on a scrubbed ScrollTrigger, then the next section slides over.
- andreas.vision, the cloud's own reference: no scroll animation, the hero scrolls away with the page.
- sebg.ch (3D mascot pinned by chapters), macmillan.studio (light parallax), matteovincenti.com (bot-blocked, Awwwards only): weak evidence, not used.

## Approaches

1. **The cloud closes in** (chosen, with 2): the clearing shrinks cell by cell and the cloud swallows the space the text leaves. From craft.wild.as, rebuilt with the site's own cloud; scroll driven, so it works on phones too.
2. **The scroll's wind** (chosen, with 1): scrolling pushes the cloud's sideways drift faster. Alone it is too quiet to read as a hero animation, so it goes with 1.
3. Pinned hero, as marimba: rejected. Desktop only, and pins have collided with the thread, ScrollSmoother and the other pins before.

Owner's choice: 1 + 2, and the hero's seam crumbles **together with** the cloud, not on its own range.

## What the visitor sees

One movement in two halves, scrubbed on the hero's exit (`start: 'top top'`, `end: 'bottom top'`, progress `x` 0 → 1):

```
x: 0 ───────────── 0.7 ──────────────── 1
   the clearing closes      │ cloud and seam
   the wind speeds up       │ crumble together
   the text rises and fades │ towards the header
```

1. **0 → 0.7, the cloud closes.** The clearing fills in cell by cell (each cell at its own random threshold, never as a shrinking contour), the wind's drift speeds up with the scroll, the headline keeps today's drift (`yPercent`, `scale`) and the whole `.copy` (headline, lede, link) fades out by 0.4. The text is fully faded before the cloud reaches its line boxes: readable text never sits on pixels.
2. **0.7 → 1, cloud and seam crumble.** The closed cloud loses its cells top rows first, in the seam's stepped manner, while the hero seam's `--p` goes 1 → 0 over the same range. At `x = 1` both are gone, as the hero's foot reaches the header.

Scrolling back up plays it backwards. The other seams (About, Side quests, Contact) keep `dissolve.ts` as today.

## Constraints

- Reduced motion: no effect at all; the cloud stays still and the text stays visible (as every effect, via `gsap.matchMedia`).
- Scrubbed tweens with `gsap.set` + `.to()` and `ease: 'none'` (CODING_STANDARDS, Firefox); works with ScrollSmoother on desktop and native scroll on phones.
- Scroll progress must still redraw the cloud while `MotionPause` has stopped the breathing and wind loop: the scroll is the visitor's own input, not an automatic animation.
- The drift stays in whole cells on the seam's grid (`drift()`), so the scroll's wind does not blow up the `cellsOf` cache: quantise the added shift to whole cells.
- The headline stays the LCP; no new request or chunk; Lighthouse mobile ≥ 0.95, CLS 0.
- The cloud's canvas stays `aria-hidden`; axe clean in both themes. The faded `.copy` keeps its link focusable: focusing it scrolls the hero back, which brings the text back.
- No green; tokens only.

## How it is built (owner left the how to Claude)

- `effects/hero.ts` owns the whole movement: one scrubbed timeline on the hero (`start: 'top top'`, `end: 'bottom top'`) drives the headline drift it already has, the opacity of the `.copy` container, the field's exit progress and the hero seam's `--p`. The entrance animates the children (`h1` lines, `.copy > p`) and clears its props, the exit fades the container: the two never write the same element.
- `effects/dissolve.ts` leaves the hero seam out (`app-pixel-dissolve:not(.seam--hero)` for the crumble), so its `--p` has one owner.
- `PixelField` exposes a method (`exit(p)`) that `hero.ts` calls from the timeline's `onUpdate`: it stores the progress, writes it to `canvas.dataset['exit']` for the e2e, and draws one frame at once. That frame is drawn even when the breathing loop is stopped by `MotionPause`, by the `IntersectionObserver` or by a hidden tab: the scroll is the visitor's input, and the last frame at `p = 1` must be empty, not frozen with cells left.
- Both painters read `frameCells` (`render.ts` for the 2D fallback, `gl.ts` for WebGL), so the closing and the crumble happen after it, at draw time, in both: the WebGL shader gets a `u_exit` uniform and computes the thresholds from the cell's position, the 2D fallback calls the same pure functions. `cellsOf` and its cache key stay as they are, apart from one more static array: the depth each cell would have with no clearing (`cloudDepth` with an empty clear), which is what a cell in the clearing fades to when it closes, so the closed cloud keeps its noise, dither and tones instead of turning into a flat slab.
- Pure functions next to `cloudDepth` in `pixel-field/field.ts`, unit tested: a cell's close threshold (stable hash, 0.4 → 0.7), its crumble threshold (0.7 → 1, top rows first with a little noise, in 8 steps as the seam), and the scroll's extra wind shift (`windShift(p)`, whole cells, 0 at `p = 0`, added to `drift(t)` before `cellsOf`, so the cache sees at most a handful of new keys per scroll).
## Tests

- Unit (`field.spec.ts`/`render.spec.ts`): at progress 0 the cells are as today; at 0.7 every cell is lit, the clearing included; at 1 none is lit; between 0.7 and 1 the top rows empty first; the wind shift is whole cells and grows with progress.
- E2E (Chromium, WebKit/iPhone): scrolling to the hero's middle and end changes the canvas (a `data-*` exposing the progress, as `data-clear` does), `.copy` opacity reaches 0, the hero seam's `--p` reaches 0; with reduced motion nothing changes. Update the specs that scroll past the hero (grep `seam--hero`, `pixel-field`, `hero` in `e2e/`).
- `npm run lhci` on the home.

## Non-goals

- No pin, no new 3D, no change to the copy, the intro entrance, the pointer pull or the ripples.
- No change to the other seams.

## Left to the builder

The exact split point (0.6 was the starting value; after the user found it too fast it is 0.4/0.7, wind 3 cells, `scrub: 1`), the wind multiplier, how much of the drift and scale the headline keeps, and the crumble's noise. Calls I made in this spec: `exit(p)` as a method, thresholds at draw time rather than in `cellsOf`, the copy fade on the container.

## Docs to update in the same branch

A row in §17 of `docs/superpowers/specs/2026-10-03-portfolio-v2-design.md`; the hero's scroll movement in `.claude/skills/edm-style/SKILL.md` (motion) and `DESIGN.md`; the architecture line on motion in `CLAUDE.md` (the hero seam's `--p` is owned by `hero.ts`).
