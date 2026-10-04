# Portfolio v2 — Un sito con vita propria — Design spec

**Data:** 2026-10-04 · **Stato:** approvato in chat, da rivedere per iscritto · **Branch:** `v2`
**Spec di riferimento:** `docs/superpowers/specs/2026-10-03-portfolio-v2-design.md` (vincoli globali, §10–§12). Questa spec la estende; in caso di conflitto vale questa per le parti che tratta.

## 1. Obiettivo

Emanuele vuole "più animazioni e che il sito abbia vita propria", prendendo come riferimento matteovincenti.com e marimba.design, e vuole che il suo volto (`content/images/icon1.png` su `master`) sia nel sito.

"Vita propria" significa entrambe le cose (scelta di Emanuele):

- **movimento autonomo**: la pagina si muove anche quando nessuno la tocca;
- **reazione alla persona**: la pagina risponde al cursore e al tocco.

Successo: chi apre il sito vede subito un hero che cambia da solo ("edm." che diventa il volto), sente la pagina "respirare" mentre scorre, e niente di questo peggiora accessibilità, prestazioni o leggibilità.

## 2. Vincoli (invariati dalla spec principale)

- WCAG 2.2 AA su ogni pagina, entrambi i temi e lingue. In particolare **2.2.2**: il movimento automatico che dura più di 5 secondi si può fermare (§7).
- `prefers-reduced-motion: reduce`: nessuno degli effetti di questa spec; resta la pagina ferma di oggi.
- JavaScript iniziale < 150 KB gzip: tutto passa dal pacchetto GSAP differito o dal codice già esistente del pixel field e del moai.
- CLS 0; Lighthouse nelle soglie di `lighthouserc.json`.
- Niente verde nella palette.
- Effetti legati al puntatore solo con `(min-width: 1024px) and (hover: hover)`.
- Il contenuto non dipende dagli effetti e funziona senza JavaScript.

## 3. "edm." diventa il volto (hero)

L'elemento memorabile del sito, ispirato a "io." → "noi." di matteovincenti.com.

**Dati.** Uno script (`scripts/portrait.mjs`) legge `icon1.png` e produce `src/app/pixel-field/portrait.ts`: una griglia di 40 × 40 indici di colore, ritagliata su testa e spalle, con lo sfondo grigio trasformato in "vuoto". Il ritratto è quantizzato su una palette di 6 colori presa dai token (grigi scuri e chiari per occhiali, barba e maglia; pesca `--px-6` e una sua variante per l'incarnato; azzurro `--px-3` per i riflessi). Niente immagine scaricata dal browser; il file pesa pochi KB e sta nel pacchetto del pixel field che è già differito.

**Disegno.** Il ritratto si scala sulla griglia del campo come oggi il glifo (`layout()`): un fattore intero e centrato. Le celle del ritratto si disegnano con il colore della palette, quelle vuote come i puntini di fondo.

**Morph.** Una funzione pura `morphProgress(index, col, row, t)` dà per ogni cella l'avanzamento 0 → 1 tra la scena "edm." e la scena "volto". Ogni cella parte con un ritardo che dipende dalla distanza dal centro più un `hash` dell'indice, così i pixel si ricompongono come un'onda frantumata e non come una dissolvenza. Durata ~1.2 s per verso.

**Quando.**

| Evento | Effetto |
|---|---|
| A riposo | ciclo automatico: "edm." 6 s → volto 4 s → "edm."… |
| Mouse sopra il campo (desktop) | resta il volto finché il mouse è sopra |
| Tocco o clic sul campo | alterna "edm." / volto (le onde al tocco di oggi restano) |
| Campo fuori schermo o scheda nascosta | il ciclo si ferma (come oggi) |
| Pausa globale (§7) | il ciclo si ferma sulla scena corrente |
| Riduzione del movimento | immagine ferma di "edm.", come oggi |

**Accessibilità.** Il canvas resta `aria-hidden`; il volto è decorativo, il testo dell'hero dice già chi è.

**SEO.** Una copia della foto vera, 512 × 512 JPEG (`public/images/emanuele.jpg`), va nel JSON-LD come `Person.image`; non compare nella pagina.

## 4. Ambiente vivo

Ispirato allo sfondo con sfere sfocate di marimba.design.

- Un livello fisso dietro i contenuti (`app-ambient`, `aria-hidden`, `pointer-events: none`, `z-index: -1`) con 5 sfere: gradienti radiali morbidi nei colori `--px-2`, `--px-3`, `--px-4`, `--px-5`, `--px-6`, opacità bassa (0.35 in light, 0.25 in dark), niente `filter: blur` (costa troppo su mobile).
- **Da sole:** ogni sfera fa un loop GSAP lento (8–14 s, `sine.inOut`, `yoyo`) su `x`, `y` e `scale`.
- **Con lo scroll:** la posizione d'insieme si sposta in parallasse (le sfere scorrono al 20–40% della pagina) e la tinta cambia per sezione: più azzurre nell'About, più lavanda nello Stack, più pesca nei Contatti.
- **Con il cursore (desktop):** tutto il livello si sposta di qualche decina di pixel verso il puntatore (`quickTo`).
- **Mobile:** 3 sfere, niente cursore.
- Non deve mai abbassare il contrasto del testo: le sfere stanno sotto i contenuti e le fasce colorate (About, Contatti) le coprono.

## 5. Il cursore (solo desktop con mouse)

- **Cursore-pixel:** un quadrato `--accent` di 8 px segue il puntatore con un leggero ritardo (`quickTo`, ~0.15 s). Su link e pulsanti diventa un quadrato vuoto di 40 px attorno all'elemento. Il cursore di sistema resta visibile: è un'aggiunta, non una sostituzione.
- **Elementi magnetici:** i pulsanti dell'hero, le voci del menu e l'email dei contatti si spostano verso il cursore di massimo 6–10 px quando è vicino, e tornano a posto quando esce. Il bersaglio del clic non si sposta oltre il proprio bordo (WCAG 2.5.8).

## 6. Vita a riposo

- **Stack:** dopo essersi disposte sull'anello, le sfere galleggiano (`y` ±6 px, fasi diverse) e si scansano dal cursore entro 120 px.
- **Moai:** oscilla piano come se respirasse (pochi gradi di beccheggio, ~4 s). Su desktop la testa ruota di qualche grado verso il cursore. Si aggiunge alla rotazione con lo scroll e al trascinamento.
- **Menu:** all'hover o al focus, le lettere di una voce si rimescolano per ~0.4 s prima di tornare il testo vero (scramble). Il testo nel DOM resta quello vero (`aria-label` uguale), quindi lettori di schermo e traduzione automatica non vedono le lettere a caso.

## 7. Un solo pulsante di pausa

- Un pulsante nell'header, "Metti in pausa le animazioni" / "Riprendi le animazioni" (`aria-pressed`), ferma tutto il movimento automatico:
  - sfere dell'ambiente;
  - ciclo e scintillio del pixel field;
  - galleggiamento dello stack;
  - respiro e rotazione automatica del moai.
- Le animazioni legate allo scroll e al cursore restano: rispondono a un'azione della persona.
- Sostituisce il pulsante del solo pixel field e quello del moai su mobile, così non ce ne sono tre.
- La scelta resta per la sessione (`sessionStorage`).
- Con riduzione del movimento il pulsante non compare: non c'è niente da fermare.
- Realizzazione: un servizio `MotionPause` con un signal `paused`, letto da pixel field, moai e dagli effetti GSAP (che mettono in pausa una timeline `ambient` dedicata).

## 8. Architettura

```
src/app/motion/
  pause.ts               MotionPause (signal paused, sessionStorage)
  effects/ambient.ts     sfere dell'ambiente
  effects/cursor.ts      cursore-pixel + magnetismo
  effects/stack-float.ts galleggiamento e repulsione delle sfere dello stack
  effects/scramble.ts    scramble delle voci del menu
src/app/layout/ambient.ts       markup delle sfere
src/app/layout/pause-toggle.ts  il pulsante di pausa
src/app/pixel-field/portrait.ts dati generati del ritratto
src/app/pixel-field/field.ts    + morphProgress(), portraitLayout()
src/app/voxel/moai-scene.ts     + respiro e sguardo verso il cursore
scripts/portrait.mjs            icon1.png → portrait.ts
```

Gli effetti nuovi seguono le regole di Plan 7: girano dentro `MotionHost` e `gsap.matchMedia`, restituiscono una funzione di pulizia per i listener e usano `gsap.set` + `.to()` per tutto ciò che è legato allo scroll.

## 9. Test

- **Unit:**
  - `morphProgress` (0 all'inizio, 1 alla fine, ritardi diversi per celle diverse, monotona);
  - `portraitLayout` (centrato, scala intera);
  - il quantizzatore dello script (`node --test`): solo colori della palette, sfondo vuoto;
  - `MotionPause` (persiste in sessione).
- **E2E:**
  - il pixel field passa da solo alla scena "volto" (attributo `data-scene` sul componente) e torna a "edm.";
  - il mouse sopra lo tiene sul volto;
  - il clic alterna le scene;
  - il pulsante di pausa ferma ciclo e sfere (le trasformazioni non cambiano in 2 s) e la scelta resta dopo una navigazione;
  - con riduzione del movimento niente sfere, niente cursore, niente pulsante di pausa;
  - il cursore-pixel compare solo su desktop e segue il mouse;
  - lo scramble lascia il testo vero nel DOM e l'accessible name invariato;
  - axe in entrambi i temi con le sfere visibili;
  - JSON-LD `Person.image` presente.
- **Budget:** `postbuild` continua a controllare il JS iniziale; LHCI nelle soglie.

## 10. Fuori da questa spec

- Lenis o qualsiasi scroll fluido alternativo.
- Sfondo WebGL o shader.
- Foto vera visibile nella pagina (solo nel JSON-LD); se in futuro servisse, si aggiunge nell'About.
