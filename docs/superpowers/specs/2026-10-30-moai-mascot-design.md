# Il moai mascotte del sito: design

**Stato:** approvato dall'autore il 2026-10-30, da pianificare. Issue #270 (collegata a #271).

## Intento

La hero della home oggi è solo testo (titolo, lede, pulsanti) e il campo di pixel. L'unica immagine dell'autore arriva in fondo alla pagina. Il moai diventa la faccia del sito: la prima cosa che il visitatore incontra, un personaggio che lo saluta, lo guarda e lo accompagna. Lo scopo è creare empatia con chi visita, senza togliere il ruolo di protagonista al titolo.

## Obiettivi

- Il moai lascia l'About e va nella hero della home.
- Ha un carattere fatto di poche reazioni leggibili: saluta, segue il cursore, guarda giù quando scorri, si addormenta quando resti fermo.
- Su desktop ti accompagna lungo la pagina, piccolo in un angolo.

## Non obiettivi

- Nessuna comparsa in altre pagine (404, case study, blog): eventualmente in una issue successiva.
- Nessuna reazione a singoli elementi (hover sui progetti, la chiave del footer, il finale con la foto).
- Sul telefono il moai non segue la pagina.
- Nessun sostituto del moai nell'About: resta solo testo.

## Anti-obiettivi (un fallimento anche se funziona)

- Il moai diventa l'LCP al posto del titolo, oppure la home scende sotto 0.95 su Lighthouse mobile.
- Il moai d'angolo copre o blocca link e pulsanti, o si fa notare più del contenuto che stai leggendo.
- Si muove con `prefers-reduced-motion`, oppure continua a muoversi dopo il pulsante di pausa dell'header (WCAG 2.2.2).
- Due scene WebGL attive insieme (hero e angolo): il moai è uno solo.

## Cosa esiste oggi

- `src/app/voxel/moai-figure.ts`: l'immagine statica (`images/moai.png` e `moai-dark.png`, 288×655 CSS px, oggi `loading="lazy"`) sotto la scena 3D, che arriva con `@defer (on viewport)`. Viene usata nell'About: `<app-moai-figure class="about-moai" data-sticky />` in `src/app/pages/home/home.ts`.
- `src/app/voxel/moai-scene.ts` e `motion.ts`: scena Three.js con respiro, testa che segue il mouse (desktop ≥ 1024 px con puntatore fine), pupille di pixel, sguardi lenti sui telefoni (`glance`, `PHONE_GAZE`), swipe orizzontale per ruotarlo (#258), bolla di gomma col doppio click o doppio tap, rotazione verso chi guarda mentre la sezione scorre (`scrollYaw`, `sectionProgress`), pausa con `MotionPause`.
- La skill `edm-style` descrive il moai alla voce "Voxel moai (About)". Va aggiornata.

## Comportamento deciso con l'autore

### Desktop (≥ 1024 px con hover)

1. **Nella hero:** il moai è in piedi, intero, a destra del titolo, con il testo su due colonne (bozza "A"). È grande quanto si può, ma il titolo resta l'elemento più grande sullo schermo (decisione dell'autore): se si scontrano, il moai si rimpicciolisce e non viene mai tagliato.
2. **All'arrivo** fa un cenno di saluto. Dopo, testa e pupille seguono il cursore, come oggi.
3. **Quando scorri** si rimpicciolisce e scivola nell'angolo in basso a destra dello schermo. Ci resta per tutta la home e guarda giù mentre la pagina scorre.
4. **Se resti fermo** per un po', chiude gli occhi, respira più lento e gli escono delle "z" di pixel. Al primo movimento (mouse, scroll, tasto, tocco) si sveglia.

### Telefono e tablet

1. **Nella hero:** testa e spalle spuntano dalla cucitura di pixel in basso a destra (bozza "B"). Titolo e pulsanti restano larghi come oggi.
2. **All'arrivo** spunta e saluta. Quando inizi a scorrere guarda giù. Lo swipe per ruotarlo resta.
3. **Non segue la pagina:** esce dallo schermo insieme alla hero.

### Sempre

- La bolla di gomma e le pupille di pixel restano.
- L'About perde il moai e resta solo testo, con un layout a una colonna che non lascia un buco.

## Vincoli

- **Prestazioni.** Lighthouse mobile ≥ 0.95 sulla home (`npm run lhci`). Il titolo deve restare l'elemento LCP: l'immagine statica nel primo schermo non è mai `priority`, e la sua area visibile resta sotto quella del titolo a ogni larghezza da 1024 px in su (da misurare con il titolo su più righe, come resta dopo il ritocco della tipografia). Three.js resta un chunk lazy, caricato dopo il primo paint (`afterPaint()`, issue #151). Quando la scena è pronta, il passaggio dall'immagine statica al 3D non causa layout shift (CLS 0).
- **Tipografia della hero su desktop.** Con la colonna di testo più stretta, titolo, lede e pulsanti devono restare sopra la piega a 1280×800 e a 1440×900. La #271 ha appena portato il titolo a 72 px per lo stesso motivo.
- **Motion.** Rispetta le regole di `edm-style` e del `CLAUDE.md`. Gli effetti desktop stanno dentro `gsap.matchMedia`. Con reduced motion il moai sta fermo nella hero, guarda avanti, non saluta, non segue la pagina e non si addormenta. Con la pausa dell'header si fermano respiro, sonno e spostamenti, e il moai d'angolo resta dov'è.
- **Smooth scroll.** ScrollSmoother sposta `#smooth-content` con un transform, quindi il moai d'angolo, che è `fixed`, deve vivere fuori da `#smooth-wrapper` (come l'header). Lo scroll si legge da `smoother()` quando c'è.
- **Accessibilità (WCAG 2.2 AA).** Il moai è decorativo: `alt=""` sulle immagini, nessun focus, niente annunci. Il moai d'angolo non intercetta i click (`pointer-events: none`), così non blocca mai il contenuto sotto.
- **Un solo WebGL.** Una sola scena e un solo contesto per tutta la home.
- **Palette:** niente verde. Le "z" usano i colori di `edm-style`.

## Lasciato a chi costruisce

- La tecnica del passaggio dalla hero all'angolo: un solo layer `fixed` animato dal riquadro della hero all'angolo con ScrollTrigger, oppure il canvas spostato da un contenitore all'altro. Vincolo: niente seconda scena.
- La forma del cenno di saluto (inchino della testa, occhiolino, piccolo salto), purché duri meno di un secondo e si legga come "ciao".
- La resa del sonno in voxel: palpebre, "z" fatte di celle da 8 px.
- Il layout dell'About a una colonna e la nuova grandezza del titolo nella hero.
- Come aggiornare l'immagine statica se la posa nella hero cambia (`scripts/moai-image.mjs`).

## Scelte mie, da confermare leggendo

- **Ritorno in cima:** su desktop, quando torni in cima, il moai riprende il suo posto nella hero, ripercorrendo al contrario lo stesso scrub.
- **Soglia del sonno:** 20 s senza input. Si addormenta anche sul telefono, se la hero resta ferma sullo schermo.
- **Misura nell'angolo:** circa 140 px di altezza, staccato di 16 px dai bordi. Sta davanti al contenuto ma non riceve i click.
- **Il gioco resta nella hero:** la bolla di gomma si soffia solo lì. Il moai d'angolo non è cliccabile, proprio perché non deve bloccare niente.
- **Rotazione legata allo scroll:** `scrollYaw` era pensata per la sezione About. Nella hero lascia il posto allo sguardo verso il basso.
- **Il moai d'angolo da fermo:** quando lo scroll si ferma, torna a seguire il cursore. Dopo 20 s senza input si addormenta anche lui. Le "z" stanno dentro il suo riquadro (sopra la testa) e non ricevono click.
- **Saluto e intro:** il cenno parte quando l'intro si è sollevata (o subito, se l'intro è saltata), una volta per ogni caricamento della home, anche tornando su `/` dentro il sito. Come l'intro, ha un tetto di tempo anche quando GSAP rallenta (lezione di `effects/intro.ts`).
- **Prima di Three.js:** se scorri prima che la scena sia pronta, è l'immagine statica a rimpicciolirsi nell'angolo. Il layer che si sposta contiene l'immagine o il canvas, e il canvas la sostituisce quando disegna il primo frame, come succede oggi in `moai-figure.ts`.

## Verifica

- Va aggiornata `e2e/moai.spec.ts` e vanno aggiunti test per: il saluto, lo sguardo verso il basso, il passaggio all'angolo solo su desktop, il sonno dopo l'inattività (con un tempo finto, mai un'attesa di 20 s veri), reduced motion e pausa.
- `grep -rn` negli e2e per `about-moai`, `app-moai-figure` e `data-gaze` prima di toccare i template. Per i test di animazione valgono le lezioni del `CLAUDE.md`: contare i draw, non confrontare i pixel; aspettare che la pagina si sia assestata.
- axe in entrambi i temi, `npm run lhci` e `npm run verify` (con `e2e:webkit`).
- Una riga nel §17 della spec v2 e la voce del moai aggiornata in `edm-style`.
