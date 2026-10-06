# Portfolio v2 — Piano 12: Strumenti per livelli — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

## Stato (2026-10-06): completato

- Etichette dei livelli: "Every day / Ogni giorno", "In production / In produzione", "In side projects / Nei progetti personali", più una frase sotto il titolo che nomina i tre livelli (2026-10-06: non parla più di "centro", perché su telefono i livelli sono righe, non anelli).
- Il diagramma non supera l'altezza dello schermo sotto la navbar (a 720 px il nome dell'anello esterno finiva sotto l'header).

**Goal:** The tools section says how deep each tool goes: three levels (every day, in production and in my thesis, in side projects) drawn as concentric rings on desktop and as steps on phones, instead of four categories repeated by four orbs.

**Architecture:** One list in the DOM (a level = heading + list of tools), laid out by CSS: concentric rings with the tools as tags on each ring from `lg`, three stepped rows below it. A pixel meter before each level name (3, 2, 1 cells) carries the depth in the list layout too. GSAP: the rings turn in on desktop, the rows step in on phones; nothing loops, so the pause button has nothing to stop here. `stack-float.ts` and `stack-tap.ts` go away with the orbs.

**Tech Stack:** Angular 22, `@angular/localize`, GSAP, Playwright.

**Spec:** request "come migliorare la sezione dei tools? vedi i 3 siti riferimento", direction A chosen by the user on 2026-10-05: craft.wild.as shows depth as levels (L1, L3, L5) and ties tools to work; the orbs (from marimba.design) only repeated the category names. The split into levels is derived from the site's content (IPS job: Angular, Signals, RxJS, PrimeNG; ApexFlow, the Telegram bots and this site: Spring Boot, Java, PostgreSQL, Docker, Node.js, Vitest, Playwright, ESLint; side projects and side quests: Next.js, React, Supabase, Tailwind CSS, Flutter, Python). Decided without asking under the goal "sii indipendente nei piani, spec e nelle domande e risposte": the user can move a tool by editing `content.{en,it}.ts`.

## Global Constraints

- WCAG 2.2 AA in both themes; tags readable on the rings (their own surface background).
- Reduced motion: rings and rows at rest.
- No horizontal scroll at any width; no green; sentence case.
- `npm run verify` exits 0 against this checkout's server.

## Review Focus

1. Tags on a ring must not overlap each other or the level name, in English and in Italian (longer words), at 1024 and 1440.
2. The section must read without the diagram: a screen reader gets three headed lists in order.
3. Phones (320 → 768): rows step right, none past the viewport.
4. The side quests band above still covers anything that moves in (z-order test stays).

---

### Task 1: Levels

- [ ] Unit (`stack-list.spec.ts`): three levels in content order, each a heading and a list; the meter has 3, 2, 1 filled cells.
- [ ] E2E (`e2e/stack-levels.spec.ts`): desktop rings — every tag's centre lies on its level's ring (± 12 px), the rings grow outwards, no two tags or labels overlap (EN and IT, 1024 and 1440); phones — each row starts further right than the one above and stays inside the viewport; reduced motion — no transform on the rings.
- [ ] Content EN/IT, lede string, `StackList` template and styles; drop orb tests, `stack-float.ts`, `stack-tap.ts`.

### Task 2: Motion

- [ ] E2E: on desktop the rings start turned and settle (rotation 0) as the section reaches mid-screen; on phones the rows start shifted and settle.
- [ ] `effects/stack-orbs.ts` → `effects/stack-levels.ts`.

### Task 3: Close

- Screenshots desktop 1280 and phone 390, both themes; README, spec §17, edm-style living object 3; verify; PR.
