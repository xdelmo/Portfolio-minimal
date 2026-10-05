# Portfolio v2 — Un filo di pixel — Design spec

**Data:** 2026-10-05 · **Stato:** implementata (piano 9) · **Branch:** `v2`
**Spec di riferimento:** `2026-10-03-portfolio-v2-design.md` (vincoli globali) e `2026-10-04-portfolio-v2-living-site-design.md` (oggetti vivi, pausa). Direttive di stile: skill `.claude/skills/edm-style/SKILL.md`.

## 1. Obiettivo

Tre richieste di Emanuele, un solo disegno:

- "il sito mobile è veramente triste, non ha nessuna interazione e le sezioni sembrano scollegate l'una dall'altra. Rivedilo per mantenere effetto wow come su desktop";
- "come si può migliorare la sezione about?";
- "migliora le sezioni sotto la hero prendendo come riferimento i soliti 3 siti" (matteovincenti.com, marimba.design, craft.wild.as).

Diagnosi (screenshot a 390 px, 2026-10-05):

- sul telefono la prima schermata non ha niente che si muove: il volto in pixel sta sotto i pulsanti;
- tra le sezioni ci sono vuoti grigi e niente che le leghi;
- tilt, cursore, mazzo dell'esperienza e repulsione delle sfere esistono solo con il mouse: su telefono restano liste di testo;
- l'About è un blocco di testo, una scheda bianca da modulo e poi il moai, senza un'idea forte.

Successo: scorrendo il sito su un telefono si vede sempre qualcosa che risponde allo scroll o al dito, si capisce che le sezioni sono tappe di uno stesso percorso, e l'About si ricorda per una frase. Su desktop il sito guadagna le stesse cuciture senza perdere niente.

## 2. Vincoli

Invariati: WCAG 2.2 AA in entrambi i temi e lingue; riduzione del movimento = nessun effetto; JS iniziale < 150 KB gzip; CLS 0; soglie Lighthouse; niente verde; effetti del puntatore solo `(min-width: 1024px) and (hover: hover)`; contenuto completo senza JavaScript.

Nuovo: ogni effetto di questa spec ha una versione per il telefono guidata dallo **scroll** o dal **tocco**, mai solo dall'hover.

## 3. Il filo (continuità tra le sezioni)

Riferimento: le tappe numerate collegate da una linea di matteovincenti.com.

- Una linea di pixel `--accent` larga 4 px scende lungo il margine sinistro della home, dall'inizio della sezione Progetti fino alla cucitura della fascia dei Contatti, dove si ferma: il finale è l'arrivo, non una tappa (modifica del 2026-10-05).
- Si **disegna con lo scroll**: la parte visibile segue l'avanzamento della pagina (scrub).
- A ogni sezione (Progetti, Side quests, Chi sono, Esperienza, Strumenti) c'è un **nodo**: un quadrato di 8 px all'altezza del titolo, spento (`--rule`) finché la linea non lo raggiunge, poi acceso (`--accent`) con un piccolo scatto a gradini.
- Posizione: 24 px a sinistra della colonna di contenuto quando c'è spazio, altrimenti a 4 px dal bordo dello schermo (dentro il gutter di 16 px su telefono).
- Decorativo: `aria-hidden`, `pointer-events: none`. Con riduzione del movimento non compare.

## 4. Le cuciture (sezioni che si toccano)

Riferimento: le fasce di pixel di craft.wild.as.

- Le due fasce colorate (About pastello, Contatti scuro) hanno il bordo superiore **a pixel**: una striscia di celle da 16 px del colore della fascia, con qualche cella delle tinte `--px-*`, che sale nella sezione precedente come se la fascia si sbriciolasse verso l'alto.
- Con lo scroll le celle compaiono in ordine pseudo-casuale con un leggero anticipo dal basso: la fascia "si forma" mentre arriva.
- Anche il fondo dell'hero si chiude con una cucitura nelle tinte del pixel field, così il volto non finisce in un vuoto.
- Senza JavaScript o con riduzione del movimento la cucitura è già formata (stato finale), quindi niente flash.
- Realizzazione: un componente `PixelDissolve` (SVG di rettangoli, `aria-hidden`) che riceve colonne, righe, colori e un orientamento; ogni cella ha una soglia `--t` calcolata da una funzione pura e la sua opacità dipende da una sola variabile `--p` (0 → 1) che GSAP anima con lo scroll.

## 5. Hero su telefono

- Sotto i 1024 px il pixel field passa **sopra il titolo**: il volto è nella prima schermata. Su desktop resta a destra.
- Le onde al tocco restano; il volto si sposta leggermente in parallasse con lo scroll.

## 6. Progetti

- Su telefono l'immagine viene **prima** del testo, a tutta larghezza della colonna.
- Ogni immagine si **compone a blocchi** mentre entra nello schermo: un velo di celle da 16 px del colore della pagina (`PixelDissolve` usato in negativo) si scioglie con lo scroll, desktop e telefono. Non è lo sfocato pixelato tolto su richiesta il 2026-10-04: l'immagine è sempre nitida, sono le celle davanti che spariscono.
- Il tilt al passaggio del mouse resta solo su desktop.

## 7. About

- Apre con una **frase grande** in condensato (`h1`-like, `wdth` 75, fino a `--step-5`): EN "I care about the parts users never see but always feel." / IT "Curo le parti che nessuno vede ma tutti sentono." Le parole si **accendono una a una** con lo scroll (da `--fg-muted` a `--fg`), riferimento la frase "Insieme." di matteovincenti.
- Il paragrafo resta, senza la frase che ora fa da titolo.
- "In breve" perde la scheda bianca: diventa una griglia di valori grandi (`--step-1`, peso 600) con le etichette piccole sopra, 2 colonne su telefono e 3 da `md`, con un filo `--rule` tra le righe.
- Moai su telefono: si gira **trascinando col dito** in orizzontale; lo scroll verticale e lo zoom restano liberi (`touch-action: pan-y pinch-zoom`).

## 8. Esperienza su telefono

- Sotto i 1024 px le voci diventano **schede che si impilano**: ognuna è `position: sticky` sotto l'header, con 8 px di scarto in più della precedente, fondo `--surface`, bordo `--rule`, niente ombre né angoli arrotondati. Scorrendo, la scheda nuova copre la precedente come nel mazzo del desktop.
- Su desktop resta il mazzo bloccato con GSAP.
- È layout, non animazione: vale anche con riduzione del movimento.

## 9. Strumenti su telefono

- Il titolo sta sopra le sfere che arrivano (`z-index`), così non viene mai coperto.
- **Tocco su una sfera**: la sfera pulsa a gradini e il gruppo di strumenti corrispondente si evidenzia per 1,6 s. Le sfere restano decorative (`aria-hidden`): la lista dei gruppi è già il contenuto.

## 10. Architettura

```
src/app/pixel-dissolve/dissolve.ts       soglie delle celle (pura) + spec
src/app/pixel-dissolve/pixel-dissolve.ts componente SVG (--p)
src/app/layout/thread.ts                 linea e nodi (markup)
src/app/motion/effects/thread.ts         disegno con lo scroll, nodi accesi
src/app/motion/effects/dissolve.ts       scrub di --p per cuciture e veli
src/app/motion/effects/about-words.ts    parole dell'About accese con lo scroll
src/app/motion/effects/stack-tap.ts      tocco sulle sfere
src/app/voxel/moai-scene.ts              + trascinamento col dito
src/app/sections/*                        layout telefono (work, about, experience, stack)
```

Regole di Plan 7 e 8: effetti dentro `MotionHost`, `gsap.set` + `.to()` per gli scrub, cleanup restituito, niente animazione automatica oltre 5 s (questa spec ne aggiunge zero: tutto risponde a scroll o tocco, quindi il pulsante di pausa non cambia).

## 11. Test

- **Unit:** soglie della dissoluzione (deterministiche, in [0, 1), più basse dal lato da cui la fascia cresce); frase dell'About presente nei contenuti EN e IT.
- **E2E (telefono e desktop):**
  - il filo compare, si allunga con lo scroll e accende i nodi in ordine; niente filo con riduzione del movimento; niente scroll orizzontale a 320 px;
  - le cuciture partono parziali e sono complete dopo lo scroll; complete subito con riduzione del movimento;
  - su telefono il pixel field sta sopra il titolo, su desktop a destra;
  - il velo dei progetti copre l'immagine prima e la libera dopo; con riduzione del movimento non copre mai;
  - le parole dell'About si accendono; con riduzione del movimento sono già piene; "In breve" senza scheda;
  - il moai si gira con uno swipe su telefono e lascia scorrere la pagina;
  - le schede dell'esperienza sono sticky sotto i 1024 px e non sopra;
  - il tocco su una sfera evidenzia il suo gruppo;
  - axe in entrambi i temi (già nella suite) con tutto questo visibile.
- **Budget:** JS iniziale, CLS e Lighthouse invariati nelle soglie.

## 12. Fuori da questa spec

- Giroscopio del telefono (iOS chiede un permesso: troppo attrito per un portfolio).
- Nuove sezioni o nuovi contenuti oltre la frase dell'About.
- Case study: restano come sono.
