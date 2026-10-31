# Il moai mascotte: piano di implementazione

> **Stato:** implementato nativamente il 2026-10-31 (l'autore ha chiesto di implementare subito), branch `feat/270-moai-mascot`. Issue #270.

**Obiettivo:** il moai diventa la mascotte e resta nell'About (la hero è solo testo, centrata): saluta, segue il cursore, guarda giù mentre scorri, dorme se resti fermo e su desktop scivola in un angolo.

**Architettura:** la figura (`app-moai-figure`) resta nell'About, a destra del testo; la scena (`moai-scene.ts`) aggiunge saluto, sguardo in giù e sonno, con la logica nelle funzioni pure di `voxel/motion.ts`; un nuovo effetto GSAP desktop (`motion/effects/moai.ts`) fissa la figura con `pin` (senza `pinReparent`) e, mentre l'About esce, la scala nell'angolo con uno scrub delle variabili `--moai-s/x/y`.

**Tecnologie:** Angular 22, Three.js, GSAP ScrollTrigger, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-30-moai-mascot-design.md`

## Vincoli globali

- Il titolo resta l'LCP; l'immagine statica non è mai `priority`; CLS 0; Lighthouse mobile ≥ 0.95.
- Hero (titolo, lede, pulsanti) sopra la piega a 1280×800 e 1440×900.
- Reduced motion: moai statico, nessun saluto, angolo o sonno. La pausa dell'header ferma respiro, sonno e movimenti.
- Un solo contesto WebGL; decorativo (`alt=""`, nessun focus); angolo `pointer-events: none`, 140 px, 16 px dai bordi.
- Sonno dopo 20 s senza input; saluto < 1 s, dopo l'intro.

## Review Focus

1. Resize attraverso 1024 px con il moai nell'angolo: deve tornare nell'About sul telefono, senza transform rimasti (lezione #109).
2. Scroll prima che Three.js sia pronto: è l'immagine statica che va nell'angolo.
3. Tornare su `/` da un'altra pagina: saluta di nuovo, una volta.
4. Pausa mentre dorme: le "z" si fermano e non si sveglia/addormenta da solo.
5. Moai nell'angolo sopra un link: il click arriva al link.

### Task 1: funzioni pure

`motion.ts`: `WAVE_MS = 900`, `wave(t): number` (rollio, 0 fuori da `[0, WAVE_MS]`), `SLEEP_MS = 20000`, `LOOK_DOWN` (beccheggio quando scorri). Rimuovere `SCROLL_SWING`, `sectionProgress`, `scrollYaw`. Test in `motion.spec.ts`.

### Task 2: layout

`home.ts`: `<app-moai-figure class="about-moai" />` nell'About dopo `.about-text` (colonna 2 su desktop, centrato sotto il testo sul telefono); la hero resta solo testo, centrata.

### Task 3: scena

`moai-scene.ts`: saluto una volta per istanza dopo `afterIntro`; `data-scrolling` e sguardo in giù mentre scorri; `data-asleep` dopo `SLEEP_MS` senza input (occhi chiusi, respiro a metà velocità, "z" di pixel), sveglia al primo input; in pausa il timer riparte.

### Task 4: angolo

`effects/moai.ts` in `Home.effects`, solo desktop: pin su `.about-moai`, scrub dalla fine dell'About verso 140 px in basso a destra; `data-corner` sulla figura per spegnere i pointer.

### Task 5: e2e e documenti

`e2e/moai.spec.ts` (saluto, sguardo in giù, angolo solo desktop, sonno con `page.clock`, reduced motion, pausa), `e2e/smooth-scroll.spec.ts` (l'angolo sotto smoother al posto dello sticky dell'About), `e2e/layout.spec.ts` (moai nell'About). Riga nel §17 della spec v2, voce del moai in edm-style. Poi `npm run verify`, `npm run e2e:webkit -- e2e/moai.spec.ts`, `npm run lhci`.
