# Avatar a voxel che percorre il filo — Design

Issue #158. Decisioni dell'utente (2026-10-11): modello a voxel a figura intera generato in codice (in futuro una scansione al suo posto); nell'hero sopra il campo di pixel, accanto al titolo su desktop e al posto della banda sopra il titolo sui telefoni; al clic o al tap una mossa a caso tra saluto, salto e giravolta; un solo canvas che segue il modello (approccio A). L'utente ha chiesto di procedere da solo dopo queste scelte.

## Obiettivo

Il mio ritratto a voxel vive nell'hero e, mentre si scorre, rimpicciolisce e scende lungo il filo a pixel della home fino al contatto. Cammina mentre si scorre, sta in attesa quando lo scroll si ferma (guardando la sezione), risale girato di spalle. Su telefono lo stesso, in miniatura.

## Unità (`src/app/avatar/`)

| File | Ruolo |
|---|---|
| `avatar.model.ts` | Le 6 parti (testa, busto, braccia, gambe) come voxel con il loro perno, proporzioni Minecraft (testa 8³, busto 8×12×4, arti 4×12×4, 32 voxel di altezza). Testa rasata, occhiali spessi, barba corta, orecchini, felpa scura, jeans, scarpe chiare. Nessun import a runtime (lo legge `scripts/avatar-image.mjs`). |
| `poses.ts` | Funzioni pure: `pose(gait, t)` per attesa e camminata, `movePose(move, t)` per saluto, salto e giravolta (null a mossa finita). La camminata va a scatti (8 pose al secondo). |
| `body.ts` | Il punto di aggancio per la scansione: `interface AvatarBody { object; update(dt, gait, look); play(move); paint(read); dispose() }`. Ora c'è solo `voxelBody()` (una `InstancedMesh` per parte, pose da `poses.ts`). La scansione sarà un `glbBody()` con `AnimationMixer` e clip con gli stessi nomi; scena, effetto e test non cambiano. |
| `avatar-scene.ts` | Il canvas Three.js: camera isometrica come il moai, colori dalle variabili CSS (ridipinge al cambio tema), disegna solo quando è visibile, pausa (`MotionPause` ferma l'attesa), clic o tap → mossa a caso, su desktop nell'hero la testa segue il puntatore. Legge dal suo contenitore `.avatar` gli attributi scritti dall'effetto: `data-place` (`hero`/`thread`), `data-gait` (`idle`/`walk`), `data-facing` (`front`/`down`/`up`/`right`). Mette `data-drawn` sul livello dopo il primo frame. |
| `avatar-still.ts` | L'immagine ferma (chiara e scura) nello slot dell'hero: c'è sempre, senza JavaScript, con "riduci movimento", senza WebGL. |
| `motion/effects/walker.ts` + `walker-path.ts` | L'effetto GSAP e la sua geometria pura. |

## Il viaggio (effetto `walker`)

`.avatar` è un livello assoluto nell'host della home (`position: relative`), sopra sezioni e filo (`z-index: 3`), spostato con le variabili CSS `--avatar-x/--avatar-y/--avatar-scale` (proprietà `translate` e `scale`, mai `transform`). Dentro `#smooth-content`, quindi segue lo scroll morbido da sé.

Tre ScrollTrigger, posizione da una funzione pura `walkerPlace(p1, p2, p3, geo)`:
1. **Hero → filo:** trigger `.trail`, da `top bottom` a `top 60%`. Dallo slot (scala 1) alla cima del filo (miniatura: livello alto 96 px su desktop, 48 px su telefono), interpolato con lo scroll.
2. **Filo:** stesso intervallo di `thread.ts` (`top 60%` → `bottom 60%`): i piedi seguono la punta della linea accesa.
3. **Contatto:** trigger `#contact`, da `top 60%` a `bottom bottom`: scende nella banda fino a 64 px dal fondo.

All'arrivo sul filo il livello prende la dimensione piccola vera (non solo la scala), così il canvas non disegna 7 volte i pixel che mostra. Camminata finché arrivano aggiornamenti di scroll, attesa dopo 200 ms senza; verso dal `direction` del trigger. In attesa sul filo guarda a destra, verso la sezione; nell'hero guarda avanti.

## Caricamento e prestazioni

- Lo slot con l'immagine ferma è nell'HTML prerenderizzato: l'LCP resta il titolo, CLS 0.
- La scena è un `@defer` dentro `@if (live)`: `live` diventa vero al primo scroll, movimento del puntatore, tocco o tasto (o dopo 5 s), mai con "riduci movimento". Scaricato subito dopo l'idratazione, Three.js finiva sul percorso critico di Lighthouse (home da 0,98 a 0,92).
- L'immagine ferma (WebP, 20 KB) aspetta il primo disegno: `src/index.html` mette `avatar-wait` su `<html>` e `AvatarStill` lo toglie dopo l'idratazione (un'immagine lazy non visualizzata non si scarica); senza JavaScript la classe non c'è.
- Il livello resta nascosto finché non è sia posizionato (`data-place`) sia disegnato (`data-drawn`, messo dalla scena sul livello); solo allora `walker.ts` nasconde l'immagine ferma con una classe (non `:has()`: Firefox non ricalcola lo stile). Se WebGL manca o il contesto si perde, resta l'immagine ferma.
- Un secondo contesto WebGL accanto al moai.

## Accessibilità

Il canvas è `aria-hidden`; l'immagine ferma ha `alt=""` (decorazione: il nome è già nel titolo e nella foto del contatto). Con "riduci movimento" nessun effetto e nessuna scena. `touch-action: pan-y pinch-zoom`. Il tasto pausa ferma l'attesa; camminata e mosse rispondono all'utente.

## Colori

Nuovi token `--avatar-*` in `_tokens.scss` con valori chiari e scuri (pelle e labbra sulla famiglia pesca, jeans sulla famiglia blu, felpa grigio scuro più chiara in tema scuro, così non sparisce sul fondo notte). Niente verde.

## Test

- Unit: modello (parti, perni, colori, simmetria), pose (ampiezze, scatti, fine delle mosse), `walkerPlace` (fasi, continuità ai confini).
- E2E (`e2e/avatar.spec.ts`): immagine ferma senza JS e con "riduci movimento" (e Three.js mai scaricato); la scena sostituisce l'immagine nell'hero; scorrendo il livello raggiunge il filo in miniatura e cammina, poi si ferma; un clic cambia il disegno; la pausa ferma l'attesa.

## Fuori da qui

La scansione (aggiungere `glbBody()` quando arriva il file), lo sguardo sul nodo che si accende (basta guardare a destra in attesa).
