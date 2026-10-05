# Portfolio v2 — Piano 10: Press start — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The game-style easter egg of issue #2 (Konami code → a "player card" with level, class, XP towards the next role and three achievements), plus one polish fix: the stack orbs no longer fly over the side quests band.

**Architecture:** A pure matcher (`konami.ts`) fed by one small listener in the app shell; the player card is a native `<dialog>` in a lazily loaded component (no weight on the initial JS). Its copy lives in `content.{en,it}.ts` (`game`), achievements drawn with the side quest sprite system (16 × 16 pixel items).

**Tech Stack:** Angular 22, `@angular/localize`, Vitest, Playwright + axe.

**Spec:** issue #2 (direzione 3 del brainstorming: livello, classe, barra XP, achievement Laurea / Agile Quiz / Flutter, "Press start", codice Konami); style `.claude/skills/edm-style/SKILL.md`. Decided without a new spec under the goal "crea piani in modo indipendente e implementali".

## Global Constraints

- WCAG 2.2 AA in both themes; the dialog is a real modal (`showModal`, Esc closes, focus returns to where it was).
- Reduced motion: the card opens without its stepped entrance.
- Initial JS < 150 KB gzip: the card is a lazy chunk.
- No green; pixel shapes, no emoji in the UI.
- Bilingual: every string in EN and IT.
- Every task ends with `npm run lint` and `npm run verify` exiting 0.

## Review Focus

1. Typing the code inside a text field (none on the site today) or with modifier keys must not open the card.
2. Phones have no arrow keys: five quick taps on the logo open it, a normal tap still goes home.
3. Closing returns focus to the element that had it; the page behind does not scroll.
4. Dark theme: the card and the sprites keep contrast.

---

### Task 1: Orbs under the side quests band

- `#side-quests` stacks above `#stack` (`position: relative; z-index: 1` on the band), so orbs flying in from the edges pass under it.
- [ ] E2E: while the stack orbs fly in, the side quests band is on top at a point where they overlap (`elementFromPoint` resolves inside `#side-quests`).
- [ ] Fix; verify; commit.

### Task 2: Konami matcher

- `src/app/game/konami.ts`: `KONAMI` (10 keys), `konamiStep(progress: number, key: string): number` → next progress (0 on a wrong key, restarting at 1 when the wrong key is the first of the code); `progress === KONAMI.length` means unlocked. Case-insensitive for `b`/`a`.
- [ ] Unit: full code → 10; a wrong key resets; `↑ ↑ ↑ ↓ …` still unlocks (restart on the repeated first key); `B`/`A` uppercase work.

### Task 3: The player card

- Content: `game` in `content.model.ts` + both locales: `level`, `role`, `next`, `xp` (0–1), `achievements: {title, detail, sprite}[]` (Graduated 2026; Agile Masterclass, won the final quiz; Flutter, also in the toolbox).
- Sprites: `cap`, `trophy`, `phone` added to `SPRITES`.
- `src/app/game/player-card.ts`: `<dialog>` with title "Press start", level, class, XP bar (`role="meter"` via `<meter>`), achievements list with sprites, a "Continue" button that closes.
- `src/app/game/game-trigger.ts` (in the app shell): keydown listener (ignores events with modifiers or from editable targets), 5 taps on the logo within 2 s; on unlock imports the card lazily and opens it.
- [ ] E2E (`e2e/game.spec.ts`): the code opens the dialog (name "Press start"), it lists 3 achievements, Esc closes and focus returns to `body`/the previous element; 5 quick taps on the logo open it on phones; one tap still navigates home; axe passes with the card open in both themes; a wrong sequence opens nothing.
- [ ] i18n extract + Italian units; verify; commit.

### Task 4: Close

- Docs: README feature list, main spec §17 row, edm-style skill (living objects), close issue #2 reference in spec §16 list.
- `npm run lint` and `npm run verify` exit 0; push `v2`; CI green.
