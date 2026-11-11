# La voce del moai: piano di implementazione

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Stato:** in corso (2026-11-09), eseguito in sessione dall'agente (l'autore: "implementa fino a pr in autonomia").

**Goal:** il moai su ogni pagina e la sua voce: fumetti a pixel che commentano le azioni dell'utente, più saltello, gomma come attesa, stiracchiata, pukao, capogiro, solletico e starnuto.

**Architecture:** le regole delle battute e il riconoscimento dei gesti sono funzioni pure con unit test (`voxel/voice.ts`, `voxel/gestures.ts`), le animazioni nuove sono funzioni del tempo in `voxel/motion.ts` lette dal loop di `moai-scene.ts`. Gli eventi da fuori della scena passano da `MoaiCues` (servizio root minimo, nel bundle iniziale: solo un set di listener). Fuori dalla home il moai arriva dalla shell (`MoaiGuest`): nell'angolo fisso su desktop, sopra il footer sul telefono; sulla home non rende niente, così la scena resta una.

**Tech Stack:** Angular 22 (signals, zoneless, `@defer`), Three.js nel chunk lazy, `$localize`, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-09-moai-voice-design.md`

## Global Constraints

- Niente battute con `prefers-reduced-motion`, in pausa (`MotionPause`), durante l'intro (`afterIntro`), sul telefono (`desktop()` falso).
- Fumetto: `aria-hidden="true"`, `pointer-events: none`, a pixel su griglia di 8 px, colori dai token, sparisce dopo `LINE_MS = 3000`.
- `COOLDOWN_MS = 10_000`; scarto, mai coda; mai la stessa variante due volte di fila; `copy` e `found` (Konami, Press start) passano sempre e sostituiscono il fumetto aperto.
- Movimenti a gradini (`steps()` o tempo quantizzato), mai elastici.
- Id i18n `@@moai.line.<reazione>.<n>`, unità aggiunte a mano in `messages.it.xlf`; "pukao" uguale nelle due lingue.
- Tutto il codice di scena nel chunk lazy; Lighthouse mobile ≥ 0.95 (home, case study, articolo).
- Ogni PR: branch `feat/393-…` da `origin/master`, PR in `devel`, merge rebase solo con CI verde.

## Review Focus

- Navigazione client-side home → case study → home: mai due scene vive (e2e conta i `app-moai-scene` nel DOM dopo ogni navigazione, Task 1).
- Resize sotto/sopra 1024 px su una pagina non home: passa da angolo a sbirciata senza due scene (Task 1, stesso e2e con `setViewportSize`).
- Battuta che arriva mentre il moai dorme fuori schermo o fuori vista: scartata (unit di `voice.ts` con `visible: false`, Task 2).
- Doppio clic che è anche l'inizio del solletico: i primi clic fanno saltello/gomma, solo il sesto mette il broncio, e durante il broncio i clic non parlano (unit di `gestures.ts`, Task 6).
- Flag della lingua che sopravvive a un ricaricamento: viene consumato alla prima lettura (e2e del Task 7).

---

## PR 1 — `feat/393-moai-everywhere`

### Task 1: il moai sulle pagine diverse dalla home

**Files:**
- Create: `src/app/voxel/moai-guest.ts`
- Modify: `src/app/app.html`, `src/app/app.ts`, `src/app/voxel/moai-figure.ts`, `src/app/voxel/moai-scene.ts`, `lighthouserc.json`
- Test: `e2e/moai.spec.ts`

**Interfaces:**
- Produces: `MoaiGuest` (`selector: 'app-moai-guest'`, `place = input.required<'corner' | 'peek'>()`); `MoaiFigure.greet = input(true)` passato a `MoaiScene.greet = input(true)` (false: nessun cenno dopo l'intro).

- [ ] Step 1: e2e in `e2e/moai.spec.ts`, describe "on other pages":
  - desktop (1280×800): su `/en/work/apexflow/`, `/en/blog/signals-in-production/`, `/en/404` c'è `app-moai-guest[data-place=corner] app-moai-figure`, il box di `.body` è a 16 px dal bordo destro e inferiore e alto 140 px (±1); nessun `a, button` visibile (dopo scroll in fondo) interseca quel box.
  - telefono (390×844): su `/en/work/apexflow/` `app-moai-guest[data-place=peek]` è subito sopra `app-site-footer` (bottom ≤ top del footer + 1), nessun `.moai-line`.
  - home: nessun `app-moai-guest app-moai-figure`; dopo click client-side su un case study e ritorno, `app-moai-scene` ≤ 1 nel DOM.
- [ ] Step 2: `npx playwright test e2e/moai.spec.ts --project=chromium -g "other pages"` → FAIL.
- [ ] Step 3: `MoaiGuest`: legge `router.url` (segnale da `NavigationEnd`) e `isHome = path è '/'`; `place='peek'` rende sempre la figura (prerender) dentro un box `overflow-y: clip` che mostra testa e spalle, nascosto con CSS a `(min-width: 1024px) and (hover: hover)`; `place='corner'` rende la figura solo dopo l'hidratazione e solo se `matchMedia` desktop è vero (segnale aggiornato al `change`), `position: fixed; right/bottom: 16px; height: 140px`, con `data-corner` sulla figura. In `app.html`: peek tra `</main>` e `<app-site-footer />`, corner fuori da `#smooth-wrapper`.
- [ ] Step 4: aggiungi `http://localhost/en/blog/signals-in-production/` a `lighthouserc.json`.
- [ ] Step 5: e2e → PASS; `npm run lint`; commit, PR.

## PR 2 — `feat/393-moai-voice`

### Task 2: regole delle battute

**Files:** Create `src/app/voxel/voice.ts`, `src/app/voxel/voice.spec.ts`

**Interfaces:**
- Produces:
  - `type Reaction = 'copy' | 'hop' | 'gum' | 'drag' | 'dizzy' | 'shake' | 'sulk' | 'sneeze' | 'dark' | 'light' | 'hello' | 'found' | 'explorer' | 'wake'`
  - `interface VoiceState { lastAt: number | null; last: Partial<Record<Reaction, number>> }`, `const QUIET: VoiceState`
  - `speak(state: VoiceState, reaction: Reaction, variants: number, now: number, random: () => number): { variant: number; state: VoiceState } | null`
  - `const COOLDOWN_MS = 10_000`, `const LINE_MS = 3000`, `const ALWAYS: ReadonlySet<Reaction>` (`copy`, `found`)

- [ ] Step 1: test: prima battuta passa; seconda a +9999 ms scartata (null); a +10000 passa; `copy` a +1 ms passa e rimette il conto; con 2 varianti e `random` sempre 0 due chiamate a 10 s danno 0 poi 1; con 1 variante dà sempre 0.
- [ ] Step 2: `npx ng test --no-watch --include src/app/voxel/voice.spec.ts` → FAIL; Step 3 implementa; Step 4 → PASS.

### Task 3: fumetto, saltello, battute di clic/gomma/trascinamento/risveglio, copia

**Files:**
- Create: `src/app/voxel/lines.ts` (le battute in `$localize`), `src/app/voxel/moai-cues.ts`
- Modify: `src/app/voxel/motion.ts` (+spec), `src/app/voxel/moai-scene.ts`, `src/app/layout/copy-email.ts`, `src/locale/messages.it.xlf`
- Test: `src/app/voxel/motion.spec.ts`, `e2e/moai.spec.ts`, `e2e/contact.spec.ts`

**Interfaces:**
- Produces: `LINES: Record<Reaction, readonly string[]>`; `MoaiCues` root: `cue(r: Reaction): void`, `listen(fn: (r: Reaction) => void): () => void` (senza listener l'evento si perde); `hop(t): { sy: number; y: number } | null` con `HOP_MS = 300` in 4 gradini; `stretch(t)` uguale con `STRETCH_MS = 600`.
- La scena: `line = signal<string | null>(null)`, `<p class="moai-line" aria-hidden="true">`, `data-hop`, `data-line` sull'host; un metodo `say(r)` che chiama `speak` con `visible && desktop && !paused && !reduced && introDone` e mostra la battuta per `LINE_MS`.

- [ ] Step 1: unit di `hop`/`stretch` (null dopo la durata, valori solo da un insieme di 4 gradini).
- [ ] Step 2: e2e: clic (`page.mouse`) sul moai → `data-hop` e `.moai-line` con "Hey." o "Yes?", nessun `data-gum`; doppio clic → `data-gum` e "Gum gum."; copia email su desktop → `.moai-line` "Talk soon." e status "Email address copied" invariato; telefono → bottone "Copied. Talk soon." e nessun fumetto; nessun fumetto al caricamento, con reduced motion, in pausa; `aria-hidden` e sparizione dopo 3 s (clock); seconda battuta entro 10 s assente; z dopo 20 s (clock), poi `mouse.move` → "Five more minutes…".
- [ ] Step 3: implementa; Step 4: `npm run i18n:extract`, unità in `messages.it.xlf`; Step 5: test → PASS, commit, PR.

## PR 3 — `feat/393-moai-idle-gum`

### Task 4: la gomma come attesa

**Files:** Modify `src/app/voxel/motion.ts` (`IDLE_GUM_MS = 10_000`), `moai-scene.ts`; Test `e2e/idle.spec.ts` o `e2e/moai.spec.ts`

- [ ] Step 1: e2e col clock: bolla (`data-gum`) a 10 s senza input, una sola fino al prossimo input, z a 20 s; un `mouse.move` a 8 s la rimanda; in pausa e con reduced motion niente; nessuna `.moai-line`.
- [ ] Step 2: nel timer del sonno: se `visible && !scrolling && !paused && !gumBlown && now - lastInput > IDLE_GUM_MS` → `blowGum()` (estratto dal doppio clic); `onInput` azzera `gumBlown`.
- [ ] Step 3: PASS, commit, PR.

## PR 4 — `feat/393-moai-gags`

### Task 5: riconoscimento dei gesti

**Files:** Create `src/app/voxel/gestures.ts`, `gestures.spec.ts`

**Interfaces:**
- `interface Sample { t: number; x: number }`
- `isShake(samples: readonly Sample[]): boolean` — almeno 4 inversioni di direzione, ogni tratto ≥ 30 px, entro 1200 ms.
- `isDizzy(turned: number): boolean` — |rotazione nel gesto| ≥ 2 giri (`4π`).
- `isTickle(taps: readonly number[], now: number): boolean` — 6 clic entro 2000 ms.
- `isSneeze(samples: readonly { t: number; y: number }[]): boolean` — ≥ 2400 px entro 400 ms.

- [ ] Test per ogni soglia, appena sotto e appena sopra; poi implementa.

### Task 6: pukao, capogiro, broncio, starnuto

**Files:** Modify `motion.ts` (`pukaoFall(t)`: caduta a gradini con due rimbalzi in 600 ms, 2000 ms a terra, 400 ms per tornare; `SULK_MS = 4000`; `DIZZY_MS = 1500`; `SNEEZE_MS = 600`), `moai-scene.ts` (pukao in un `Object3D` suo, voxel con colore `pukao`; host `data-pukao="off"`, `data-sulking`, `data-dizzy`, `data-sneeze`), `lines.ts`, `messages.it.xlf`; Test `e2e/moai.spec.ts`

- [ ] e2e: trascinamento avanti e indietro veloce → `data-pukao="off"` e "My pukao!", poi senza l'attributo dopo ~3 s (clock); 6 clic rapidi → `data-sulking` e "Hmph. Not talking to you."; trascinamento lungo → `data-dizzy`; scroll veloce (`mouse.wheel`) col moai nell'angolo → `data-sneeze`.
- [ ] Priorità a fine gesto: scosso > capogiro > trascinamento.

### Task 7: eventi globali

**Files:** Modify `theme-toggle.ts` (`cue(dark|light)` dopo il toggle), `language-switch.ts` (`sessionStorage['moai-hello'] = '1'` in `switchTo`), `game-trigger.ts` (`cue('found')` in `open`), `case-study.ts:388` (`cue('explorer', true)`), `moai-cues.ts` (`cue(r, keep = false)`: con `keep` e senza listener resta in attesa; `listen` consuma l'attesa e il flag `moai-hello`), `moai-scene.ts` (`listen` dopo `afterIntro`); Test `e2e/moai.spec.ts`, `e2e/game.spec.ts`

- [ ] e2e: clic sul tema → "Lights off. I'll keep watch."; poi (clock +10 s) → "Morning already?"; cambio lingua da un case study → "Ciao!" sulla pagina italiana, e `page.reload()` non lo ripete; Konami → "I knew you'd find it."; ultimo case study non letto (localStorage `explored` precompilato) → "You read them all. Respect.".
- [ ] `npm run verify` in `caffeinate -is`, commit, PR.
