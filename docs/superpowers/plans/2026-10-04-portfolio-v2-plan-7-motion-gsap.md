# Portfolio v2 — Piano 7: Motion con GSAP — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Give the home page the "wow" of the two references Emanuele picked (matteovincenti.com, marimba.design) with GSAP, ScrollTrigger and SplitText, without losing what the site already guarantees (WCAG 2.2 AA, CLS 0, initial JS < 150 KB, content without JavaScript).

**Architecture:** GSAP lives in a lazy chunk (`src/app/motion/gsap.ts`) imported after hydration, so the initial bundle does not grow. Each effect is one function `(root: HTMLElement, g: Gsap) => void` in `src/app/motion/effects/`, written against a GSAP context so that `ctx.revert()` undoes everything. `MotionHost` (a directive on the home page root) loads GSAP in `afterNextRender`, runs the effects inside `gsap.matchMedia()` with the conditions `(prefers-reduced-motion: no-preference)` and, for pins and hover effects, `(min-width: 1024px) and (hover: hover)`, and reverts on destroy. Every effect runs in `try/catch`: a failing effect leaves the static page. Visual changes that must hold without GSAP (section tones, layout of the orbs) are plain CSS; GSAP only moves things.

**Tech Stack:** GSAP 3.15 (`gsap`, `gsap/ScrollTrigger`, `gsap/SplitText`, all free), Angular 22 `afterNextRender`, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-03-portfolio-v2-design.md` §10 (GSAP + ScrollTrigger + SplitText, `afterNextRender`, `gsap.context().revert()`), §11 (robustness, reduced motion, pin only on desktop, no scroll lock), §12 (targets). This plan reverses the Plan 5 ruling that replaced GSAP with CSS: Emanuele asked for GSAP explicitly ("ci vuole gsap per forza").

## Stato (2026-10-04): completato

Tutti i task fatti, review finale (opus) eseguita, due correzioni importanti applicate. Decisioni prese durante l'esecuzione (dettaglio nel registro `.superpowers/sdd/…/progress.md`):

- GSAP sostituisce le rivelazioni CSS dei titoli e la linea `draw-line` dell'Experience.
- I test e2e saltano l'intro (`e2e/fixtures.ts`), tranne `e2e/intro.spec.ts`.
- Hero: il titolo cresce con `scale` invece dell'asse `wdth` del font (eviterebbe CLS); l'entrata riga per riga avviene solo dietro l'intro.
- Experience: mazzo di carte bloccato invece di un elenco; Stack: una sfera per gruppo (quattro).
- Contatti: fascia scura che si allarga a tutta larghezza invece del cerchio che cresce (il cerchio lasciava testo chiaro sulla pagina chiara); l'inset iniziale si ferma prima del testo.
- Intro solo su desktop (≥ 1024 px con hover): su mobile Lighthouse scendeva a 0.92 di prestazioni e misurava il contrasto a metà dissolvenza.
- Il verde è stato tolto dalla palette su richiesta: fasce azzurro/blu notte, `--px-5` lavanda.
- Correzioni della review: il testo dei contatti non esce mai dalla fascia; un revert di `matchMedia` durante l'intro la chiude invece di lasciare il pannello fermo.

Minori rimandati: listener `afterIntro` dell'hero non cancellato se l'effetto riparte durante l'intro; titolo dei progetti che può restare spostato di 12 px dopo un revert; possibile spostamento del layout caricando la home a metà pagina su desktop; titolo dei contatti mai riportato a testo semplice (taglierebbe eventuali discendenti); nessun test della riserva CSS dell'intro quando il pacchetto GSAP non si scarica.

## Reference analysis (what the two sites do, observed in Chrome)

- **marimba.design** (GSAP + ScrollTrigger + Observer): preloader where the logo letters light up one after the other, then the dark panel lifts and uncovers the page; a pinned background with blurred pastel orbs and gradient stars that drift with a scrubbed timeline; the orbs gather around a circle ("My design practice") as you scroll; a laptop opens with scroll; the "process" section is pinned for 200% while coloured discs fall and stack one by one; the contact turns the whole page dark green.
- **matteovincenti.com** (React, CSS transitions, canvas): a draggable wireframe 3D shape that morphs between three forms on tabs; a giant display word that grows with scroll; section bands in different colours (dark, paper, mint); "io." morphing into "noi." with a network of points on a button press; project rows where a tilted preview card follows the cursor and the title slides; a reading-progress bar under the header; a giant "PARLIAMONE" closing the page.

## Mapping onto this portfolio

| # | Effect | Reference | Where |
|---|---|---|---|
| 1 | Intro: the name lights up letter by letter in pixel style, then the panel lifts | Marimba preloader | app shell, first visit of the session |
| 2 | Hero headline revealed line by line, then widens on the `wdth` axis and drifts as you scroll; pixel field parallax | Matteo giant word | home hero |
| 3 | Section titles rise out of a mask line by line | both | every `main section h2` |
| 4 | Project image tilts toward the cursor, title slides | Matteo projects | work list, mouse only |
| 5 | Experience pinned; entries arrive and stack with scroll, the line grows | Marimba process | experience, ≥ 1024 px |
| 6 | Three pastel orbs (front end, back end, quality) gather around a circle | Marimba expertise | stack section |
| 7 | About on a pastel band; contact opens with a growing circle on a dark band and a giant heading rising | Matteo bands + Marimba contact | about, contact |
| 8 | Reading-progress bar | Matteo header | app shell |

Not taken: Lenis smooth scroll (earlier ruling: breaks keyboard and sticky scrolling), the laptop (no device mockups of this content), the 3D morphing shape (the moai already fills that role).

## Global Constraints

- Every command runs with `export PATH="$HOME/.local/node/current/bin:$PATH";` in front.
- `npm run lint` zero warnings; `npx ng test --no-watch`, `npm run test:scripts`, `npm run build` (initial JS budget 150 KB gzip enforced by postbuild), `npm run e2e`, `npm run lhci` green at the end.
- `prefers-reduced-motion: reduce` → no intro, no pin, no scrub, no SplitText; the page is the static one.
- No pin below 1024 px; scrolling is never locked; no `touch-action` changes.
- Text stays real text: SplitText keeps an accessible label (`aria: 'auto'`), decorative layers are `aria-hidden`.
- Contrast AA in both themes for every band (axe in light and dark, as now).
- No new UI string without an `@@id` and Italian target.

## Review Focus

1. Navigating home → case study → home with the router: every ScrollTrigger and pin spacer must be gone after leaving, and re-created once on return (no duplicates, no leftover `pin-spacer`).
2. Resizing across 1024 px (or rotating a tablet): pins appear/disappear through `matchMedia` without leaving the layout broken.
3. The intro must never trap the page: if GSAP fails to load, the overlay disappears by itself within 3 s and never intercepts clicks.
4. Anchor links (`/#contact`, the hero buttons) jump to the right place even with a pinned section above the target.
5. SplitText on hydrated text: splitting must happen after hydration and be reverted before Angular re-renders (language switch is a full navigation, so only destroy matters).

---

### Task 1: GSAP infrastructure

**Files:** Create `src/app/motion/gsap.ts`, `src/app/motion/motion-host.ts`, `src/app/motion/motion-host.spec.ts`; Modify `package.json`, `src/app/pages/home/home.ts`.

**Interfaces:**
- `loadGsap(): Promise<{ gsap: typeof gsap; ScrollTrigger: typeof ScrollTrigger; SplitText: typeof SplitText }>` (registers the plugins once).
- `type Effect = (root: HTMLElement, m: Motion) => void` where `Motion = { gsap; ScrollTrigger; SplitText; desktop: boolean }`.
- `MotionHost` directive `[appMotion]` with input `appMotion: readonly Effect[]`; it adds `data-motion="ready"` on its host after the effects ran (used by e2e), `data-motion="off"` when reduced motion.

- [x] Unit test (`motion-host.spec.ts`): with `matchMedia('(prefers-reduced-motion: reduce)')` true, effects are never called and the host gets `data-motion="off"`; with an effect that throws, the other effects still run and the host still gets `ready`; destroying the host calls `revert` on the matchMedia instance. Use a fake loader injected through an `InjectionToken<() => Promise<MotionLib>>` (`MOTION_LOADER`) whose default is `loadGsap`.
- [x] `npm i gsap@3.15.0`; implement; home template root wraps the sections in `<div [appMotion]="effects">` (no layout change: `display: contents`).
- [x] Build: initial JS stays within ~1 KB of 113.4 KB (GSAP must be in a lazy chunk; check `postbuild` line).
- [x] Commit `feat: load GSAP lazily and run motion effects through one host`.

### Task 2: Intro

**Files:** `src/index.html` (inline flag), `src/app/layout/intro.ts` (+ in `app.html`), `src/app/motion/effects/intro.ts`, `src/styles/_base.scss`, `e2e/motion.spec.ts`.

- Inline script (next to the theme one): if `matchMedia('(prefers-reduced-motion: no-preference)').matches` and `sessionStorage.getItem('intro') !== '1'`, add class `intro` to `<html>` and set the flag. No JS → no class → no overlay.
- `Intro` component: full-screen `div.intro` (`aria-hidden="true"`, `pointer-events: none` from the start), background `--fg`, the name in large type made of letters; shown only under `html.intro`. CSS failsafe: `animation: intro-out 0.4s 3s forwards` (lifts it away) so a failed GSAP load never leaves it on screen.
- Effect (runs on any page through `MotionHost` in `App`): timeline — letters from `opacity 0.15` to `1` with stagger 0.05 in pixel colours, hold 0.2 s, panel `yPercent: -100` with `expo.inOut` 0.9 s, then remove the `intro` class; the hero reveal (Task 3) starts on `intro:done` (a `CustomEvent` on `document`) or immediately if there is no intro.
- e2e: overlay visible at load, gone (`toBeHidden`) within 3 s; never intercepts a click on the hero CTA (click right after load works); not shown on a second page view in the same session; not shown with `reducedMotion: 'reduce'`; not shown with JS disabled.
- Commit `feat: open the site with a pixel intro`.

### Task 3: Hero headline and section titles

**Files:** `src/app/motion/effects/hero.ts`, `src/app/motion/effects/titles.ts`, remove the CSS `reveal-title` from `_base.scss`, update `e2e/motion.spec.ts`.

- Hero: `SplitText.create(h1, { type: 'lines', mask: 'lines', autoSplit: true, aria: 'auto' })`, lines from `yPercent: 110` stagger 0.08 `expo.out` 1.1 s, then lede/actions fade up. Scroll scrub (hero `top top` → `bottom top`): h1 `fontVariationSettings` from `'wdth' 100` to `'wdth' 75`... and `y: -60`; pixel field `y: 80, scale: 1.08`. The h1 font-size goes to a display size (`--step-display: clamp(3rem, 1.2rem + 7.5vw, 8rem)`) only with CSS; CLS checked by the existing hero test.
- Titles: each `main section h2` (not the hero) split into lines with mask, `yPercent: 110 → 0` on `top 85%`, `once: true`.
- e2e: after load the hero h1 is fully visible (no line still translated) within 3 s; with reduced motion no `.split-line`/mask wrappers exist; section h2 text content unchanged (accessible name intact) after splitting; anchor `/en/#work` lands with the title visible.
- Commit `feat: reveal the hero and section titles with SplitText`.

### Task 4: Work hover

**Files:** `src/app/motion/effects/work-hover.ts`, `work-list.ts` styles, `e2e/motion.spec.ts`.

- Desktop + hover only: for each `.project`, `gsap.quickTo` on the `.media` `rotationY`/`rotationX` (±6°, `transformPerspective: 900`) following the pointer, title `x: 12` on enter, back on leave. The existing pixel flash stays.
- e2e (chromium desktop): hovering and moving over a project changes the media's transform; leaving returns it to identity within 1 s.
- Commit `feat: tilt project images toward the cursor`.

### Task 5: Pinned experience

**Files:** `src/app/motion/effects/experience.ts`, `experience-timeline.ts` (remove its CSS scroll line), `e2e/motion.spec.ts`.

- ≥ 1024 px: pin `#experience` (`start: 'top top', end: () => '+=' + items * 60 + '%'`, `scrub: 0.6`, `anticipatePin: 1`); timeline: each `li` from `y: 80, opacity: 0` to stacked position in sequence, the line `scaleY 0 → 1`. Below 1024 px: each `li` fades up once on enter. The text is in the DOM and readable at every step (opacity animates from 0 only after the trigger starts, i.e. never on load).
- e2e: desktop — after scrolling past the section every entry is visible and a `.pin-spacer` exists while on the home page and is gone after navigating to a case study; mobile (`android` project) — no `.pin-spacer`; keyboard: tabbing to the contact link scrolls past the pin and the link is on screen.
- Commit `feat: pin the experience and stack its entries with scroll`.

### Task 6: Stack orbs

**Files:** `stack-list.ts` (orbs markup + CSS, decorative), `src/app/motion/effects/stack-orbs.ts`, `e2e/motion.spec.ts`.

- Markup: a `div.orbs` `aria-hidden="true"` with a ring and three orbs labelled by the group names (blurred radial gradients from `--px-2`, `--px-4`, `--px-5`, `--px-6`), placed on the ring by CSS (static final state, so no-JS and reduced motion show the arranged diagram). Labels inside orbs use `--fg` on light pastel, contrast checked by axe (decorative but visible text: keep ≥ 4.5:1 anyway).
- Effect: scrub from scattered (`x/y` offsets ±30 vw, `scale 0.6`, `filter: blur(16px)`) to the ring position, ring `scale 0.8 → 1, opacity 0 → 1`, as the section crosses the viewport (`top bottom` → `center center`).
- e2e: with reduced motion the orbs sit on the ring (transform none); after scrolling to the section centre the orbs' transform is identity.
- Commit `feat: gather the stack into pastel orbs around a ring`.

### Task 7: Bands, contact finale, progress bar

**Files:** `home.ts` (band classes), `_tokens.scss` (band tokens for both themes), `src/app/motion/effects/finale.ts`, `src/app/layout/progress-bar.ts` + `effects/progress.ts`, `e2e/motion.spec.ts`, `e2e/pages.spec.ts` (axe unchanged).

- Tokens: `--band-pastel-bg`/`--band-pastel-fg` (light: `--px-5` mint `#a8e0c8` with `--fg`; dark: `#17332b` with `#e8f5ef`), `--band-dark-bg`/`--band-dark-fg` (light: `#1d1d1c` / `#f2f2f2`; dark: `#0b2a1f`... checked ≥ 4.5:1 for text and links (`--band-dark-link`)). About gets the pastel band, contact the dark band, full-bleed through a `::before` so the container keeps its width.
- Contact heading becomes display size; effect: band `clipPath: circle(0% at 50% 100%) → circle(150% at 50% 100%)` scrubbed `top bottom → top 30%`, heading lines (SplitText) rising with `yPercent 100 → 0` scrubbed.
- Progress bar: fixed 3 px bar at the top (`aria-hidden`), `scaleX` scrubbed over the whole document; created only by the effect (no element without JS).
- e2e: contact band background is the dark token after scrolling to it; axe passes on `/en/` and `/it/` in both themes after scrolling to the bottom (new test: scroll, then analyze); progress bar scaleX ≈ 1 at the bottom.
- Commit `feat: colour the about and contact bands and open the contact with a circle`.

### Task 8: Close

- [x] Remove stale tests that asserted the CSS reveal (`reveal-title`, `draw-line`), keep their intent through the GSAP tests.
- [x] Review screenshots in Chrome at 1440 and 390 px, both themes; fix what looks off.
- [x] `npm run lint && npx ng test --no-watch && npm run test:scripts && npm run build && npm run e2e && npm run lhci`. If LHCI performance drops below 0.95 because of the intro (LCP behind the overlay), restrict the intro to the first visit on desktop and re-measure.
- [x] CLAUDE.md: a "Motion" line (GSAP lazy chunk, effects in `src/app/motion/effects/`, `MotionHost`, reduced motion = off).
- [x] Push, CI green, final review (opus), one fix pass.
