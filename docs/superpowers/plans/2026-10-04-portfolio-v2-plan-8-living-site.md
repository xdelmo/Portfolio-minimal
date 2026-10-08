# Portfolio v2 — Piano 8: Un sito con vita propria — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** "edm." that turns into Emanuele's face, an ambient layer of drifting orbs, a pixel cursor with magnetic targets, idle life in the stack, the moai and the menu, and one pause button for all automatic motion.

**Architecture:** Pure, unit-tested functions for the portrait morph next to the existing pixel-field code; new GSAP effects in `src/app/motion/effects/` run by `MotionHost` (Plan 7 rules: cleanup returned, `gsap.set` + `.to()` for scrubbed tweens); one `MotionPause` service (signal + sessionStorage) read by the pixel field, the moai and an `ambient` GSAP timeline.

**Tech Stack:** Angular 22, GSAP 3.15 (lazy chunk), Canvas 2D, Three.js (moai), Playwright, Vitest, `node --test`, `sharp`-free PNG decoding via Playwright's Chromium canvas in the build script (same approach as `scripts/og-images.mjs`).

**Spec:** `docs/superpowers/specs/2026-10-04-portfolio-v2-living-site-design.md` (extends `2026-10-03-portfolio-v2-design.md`).

## Stato (2026-10-04): completato

Decisioni prese durante l'esecuzione (registro in `.superpowers/sdd/…/progress.md`):

- Pulsante di pausa con etichetta fissa e `aria-pressed`; nascosto via CSS con riduzione del movimento (niente spostamento del layout).
- Il volto: le celle che cambiano si "girano" come pixel invece di viaggiare (glifo e ritratto hanno numeri di celle diversi); colori del ritratto dai token del sito.
- Il tono delle sfere ambiente si campiona ogni 250 ms: gli eventi di scroll perdevano i salti del refresh di ScrollTrigger.
- Magnetismo e galleggiamento passano dalla proprietà CSS `translate` (variabili `--mx`, `--my`, `--fy`, `--rx`, `--ry`), così non si scontrano con i `transform` di hover e di GSAP.
- Lo scramble riscrive per ~0,4 s il testo visibile; un `aria-label` tiene il nome accessibile.
- `Person.image` punta a `/en/images/emanuele.jpg`: i file pubblici stanno sotto ogni lingua.
- Tolto anche, su richiesta, il lampo pixelato sulle immagini dei progetti.

## Global Constraints

- WCAG 2.2 AA, both themes; 2.2.2 satisfied by the single pause button.
- Reduced motion: none of these effects, no pause button.
- Initial JS < 150 KB gzip (postbuild check); LHCI thresholds; CLS 0.
- No green. Pointer effects only with `(min-width: 1024px) and (hover: hover)`.
- `npm run lint` zero warnings; every task ends green.

## Review Focus

1. Pause pressed, then navigation to a case study and back: still paused, nothing restarts.
2. Theme switch while the portrait is shown: the portrait repaints with the new palette.
3. Orbs never lower text contrast (axe with orbs visible, both themes).
4. Scramble never changes the accessible name of the menu links (it rewrites the visible text for ~0.4 s; an `aria-label` keeps the name, see the ruling above).
5. Phones: no cursor element, no magnetic offsets, three orbs only.

---

### Task 1: One pause button

- Create `src/app/motion/pause.ts` (`MotionPause`, `paused` signal, `toggle()`, sessionStorage key `motion-paused`), unit spec.
- Create `src/app/layout/pause-toggle.ts` (header button, `aria-pressed`, labels `@@motion.pause` "Pause animations" / `@@motion.play` "Play animations"; hidden with reduced motion).
- Pixel field: drop its own button; `frame.animate` follows `!paused()`.
- Moai: drop the phone spin button; spin follows `!paused()`.
- E2E: update `pixel-field.spec.ts`, `moai.spec.ts`; new tests for the header button (keyboard, persists across navigation, absent with reduced motion).

### Task 2: Portrait data and morph

- `scripts/portrait.mjs` + `scripts/portrait-lib.mjs` (quantizer, `node --test`): `public/images/emanuele.jpg` 512 px and `src/app/pixel-field/portrait.ts` (40 × 40 indices, 0 = empty).
- `field.ts`: `portraitLayout()`, `morphProgress()`; unit specs.
- `render.ts`: draw the blend of the two scenes per cell; palette gains `portrait` colours.
- `pixel-field.ts`: scene cycle (6 s edm., 4 s face), hover holds the face, click toggles, `data-scene` attribute; e2e.

### Task 3: Ambient orbs

- `src/app/layout/ambient.ts` (5 orbs, `aria-hidden`), `src/app/motion/effects/ambient.ts` (drift loops on a paused-aware timeline, scroll parallax and per-section tint, cursor offset on desktop, 3 orbs on phones); e2e incl. axe.

### Task 4: Pixel cursor and magnetic targets

- `src/app/layout/pixel-cursor.ts`, `src/app/motion/effects/cursor.ts`; e2e (desktop only, follows the mouse, grows on links, absent on phones and with reduced motion).

### Task 5: Idle life

- `effects/stack-float.ts` (float + repel), `effects/scramble.ts` (menu), moai breathing and look-at-cursor in `moai-scene.ts`; e2e.

### Task 6: Person image in JSON-LD

- `seo.ts` `homeJsonLd`: `image` = `${SITE_URL}/images/emanuele.jpg`; unit spec; e2e asserts it.

### Task 7: Close

- Full suite: `npm run lint && npx ng test --no-watch && npm run test:scripts && npm run build && npm run e2e && npm run lhci`.
- Docs: spec §17 of the main spec, README, CLAUDE.md.
- Push, CI green, final review, one fix pass.
