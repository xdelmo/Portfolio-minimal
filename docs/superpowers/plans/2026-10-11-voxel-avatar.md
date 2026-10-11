# Avatar a voxel che percorre il filo — Implementation Plan

## Stato (2026-10-11): completato

Deviazioni dalla spec: Three.js parte al primo segno del visitatore (scroll, puntatore, tasto) o dopo 5 s invece che `on idle`, e l'immagine ferma (WebP, 20 KB) aspetta il primo disegno: tutti e due prima del disegno portavano la home da 0,98 a 0,92 su Lighthouse. Lo slot nasconde l'immagine con una classe messa da `walker.ts`, non con `:has()` (Firefox non ricalcola). Miniatura sul filo: 96 px su desktop, 48 su telefono.

> **For agentic workers:** eseguito inline (l'utente ha chiesto di procedere da solo). Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** il mio ritratto a voxel nell'hero che, con lo scroll, rimpicciolisce e percorre il filo a pixel fino al contatto (issue #158).

**Architecture:** modello e pose puri in `src/app/avatar/`; `AvatarBody` isola il corpo (voxel ora, GLB scansionato poi); un componente Three.js disegna in un livello `.avatar` che l'effetto GSAP `walker` sposta con variabili CSS, calcolando la posizione con la funzione pura `walkerPlace`.

**Tech Stack:** Angular 22 (zoneless, signals), Three.js (già dipendenza), GSAP ScrollTrigger, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-11-voxel-avatar-design.md`

## Global Constraints

- Nessun verde; colori solo da variabili CSS con valore chiaro e scuro.
- LCP resta il titolo dell'hero; nessuna richiesta prima del primo disegno; CLS 0; Lighthouse home ≥ 0,95.
- "Riduci movimento": nessuna scena, Three.js mai scaricato. Tasto pausa: ferma l'attesa.
- Niente `position: fixed/sticky` dentro `#smooth-content`; spostamenti con `translate`/`scale`, non `transform`.
- WCAG 2.2 AA nei due temi (axe nell'e2e). `touch-action: pan-y pinch-zoom` sul canvas.

## Review Focus

- Ridimensionamento della finestra a metà pagina (desktop ↔ telefono): la geometria si ricalcola al refresh di ScrollTrigger → test unit di `walkerPlace` con geometrie diverse; e2e con viewport telefono.
- Scroll morbido (desktop): il livello è dentro il contenuto mosso dallo smoother → misure relative all'host, mai a `scrollY`.
- WebGL assente o contesto perso: resta l'immagine ferma → e2e.
- Pin dell'esperienza dentro il filo: i piedi seguono la punta della linea anche durante il pin → stessa progressione di `thread.ts`.
- Pagina ricaricata a metà scroll: il livello si posiziona subito al punto giusto (`walkerPlace` all'avvio con il progress corrente).

---

### Task 1: modello e immagine ferma
- [x] `avatar.model.ts` + spec (parti, perni, colori, simmetria a parte i dettagli del viso), `iso.ts` generico sui colori.
- [x] Token `--avatar-*` chiari e scuri in `_tokens.scss`.
- [x] `scripts/avatar-image.mjs` → `public/images/avatar{,-dark}.webp`, `avatar-image.ts`.

### Task 2: pose
- [x] `poses.ts` + spec: `idlePose`, `walkPose` (a scatti, 8 fps), `movePose` (wave/jump/spin, null a fine mossa).

### Task 3: corpo e scena
- [x] `body.ts` (`AvatarBody`, `voxelBody`), `avatar-scene.ts` (+ spec di creazione come `moai-scene.spec.ts`).

### Task 4: percorso e effetto
- [x] `walker-path.ts` + spec (`walkerPlace`), `effects/walker.ts`.
- [x] Home: slot con `avatar-still`, livello `AvatarLayer` con `@defer` al primo segno del visitatore, host `position: relative`, CSS.

### Task 5: e2e, verifica, documentazione
- [x] `e2e/avatar.spec.ts`; screenshot 1280 e 390 nei due temi; Lighthouse home.
- [x] Skill `edm-style` (oggetto vivo), CLAUDE.md (architettura), stato del piano.
