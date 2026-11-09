# La voce del moai: design

**Stato:** approvato dall'autore il 2026-11-09, da pianificare. Issue #393 (con i tre commenti: la gomma come attesa, il clic singolo, il risveglio).

## Intento

Su desktop il moai resta sempre in vista: è nel pin dell'About e poi, rimpicciolito, nell'angolo in basso a destra (`motion/effects/moai.ts`). Diventa la voce del sito. Le battute escono da lui, così i testi delle sezioni restano sobri. Il modello è il personaggio di sebg.ch, che commenta quasi tutto quello che fai (decisione dell'autore). Il moai però resta di pietra: è chiacchierone ma non perde la calma, e scherza soprattutto su di sé, sul suo peso, sui suoi secoli di immobilità e sul pukao che gli scivola (decisione dell'autore).

## Obiettivi

- Le reazioni della tabella sotto, ciascuna con 1–3 varianti di battuta, così chi ci gioca non sente sempre la stessa.
- Ogni reazione ha un movimento a scatti (`steps()` o tween a gradini), mai elastico: è pietra, non gomma.
- La gomma diventa il passo intermedio tra attesa e sonno (secondo commento dell'issue).
- Il clic singolo ha una risposta sua, il saltello (terzo commento).
- Al risveglio il moai si stiracchia e parla (quarto commento).

## Non obiettivi

- Nessun menu "What should I do?" come su sebg.ch: le gag partono solo da azioni dell'utente.
- Nessuna battuta all'arrivo né al ritorno sul sito ("Oh hi, you're back"): l'unico saluto all'arrivo resta il cenno di oggi, senza parole.
- Nessuna battuta sul telefono, dove il moai non segue la pagina. Le reazioni fisiche (saltello, gomma, sonno) restano anche lì, dove esistono già.

## Il moai su tutte le pagine

L'autore vuole il moai anche fuori dalla home, cioè su case study, blog, articoli e 404 (decisione dell'autore). Per il telefono ha lasciato a me la scelta.

- **Desktop:** su ogni pagina il moai sta nell'angolo in basso a destra, con la stessa misura e la stessa distanza dai bordi della home (`CORNER_PX`, `CORNER_GAP`). Fuori dalla home non c'è il pin a grandezza piena, perché non c'è un About accanto a cui stare. Fa tutto quello che fa sulla home, tranne il cenno di saluto all'arrivo, che resta solo sulla home.
- **Telefono (scelta mia):** un moai fisso in un angolo coprirebbe il testo e la zona del pollice. Su ogni pagina diversa dalla home, quindi, spuntano testa e spalle dalla cucitura di pixel sopra il footer, nel flusso della pagina e non fisso. È il punto in cui hai finito di leggere. Si carica con `@defer (on viewport)`, così non costa niente a chi non arriva in fondo. Al tocco fa il saltello, con il doppio tocco la gomma, con lo swipe si gira. Non ha fumetti, come sulla home.
- **Una sola scena WebGL per pagina.** Navigando tra le pagine il moai non deve restare in due posti.
- **Non copre niente di cliccabile.** Nell'angolo del desktop lascia liberi i link a fondo articolo, i bottoni di copia del codice, il footer e la player card. Chi costruisce lo verifica pagina per pagina con un e2e.
- **Prestazioni:** Three.js resta un chunk lazy dopo il primo paint su ogni pagina. LCP e Lighthouse ≥ 0.95 non cambiano su case study e articoli (vanno aggiunti a `lighthouserc.json` se non ci sono).

### Le due battute legate a un cambio di pagina

- **Badge Explorer:** si sblocca sul case study che completa la serie. Il moai è lì nell'angolo e lo dice subito.
- **Cambio lingua:** il cambio imposta un flag in `sessionStorage` prima di ricaricare. Sulla pagina nuova il moai dice "Hello!" / "Ciao!" nella lingua nuova, appena finita l'intro, o subito dove l'intro non c'è. È l'unica eccezione alla regola "niente battute all'arrivo" (decisione dell'autore: tenerla).
- Sul telefono nessuna delle due ha un fumetto.

## Anti-obiettivi (un fallimento anche se funziona)

- Il moai disturba la lettura: parla da solo, parla spesso, o il fumetto copre testo e pulsanti.
- Lo screen reader sente due volte la stessa cosa, o sente le battute.
- Qualcosa si muove con `prefers-reduced-motion` o dopo il pulsante di pausa (WCAG 2.2.2).
- Il tono diventa da cartone animato (esclamazioni a raffica, rimbalzi elastici).
- La home scende sotto 0.95 su Lighthouse mobile, o il codice delle battute finisce nel primo caricamento invece che nel chunk lazy del moai.

## Il fumetto

- È a pixel, come le z del sonno: bordo a gradini su griglia di 8 px, colori dai token di `_tokens.scss`, coda a scalini verso la testa.
- Compare con un'animazione a scatti e sparisce da solo dopo circa 3 s.
- Ha `aria-hidden="true"`: le battute sono decorazione. Le informazioni vere passano solo dai messaggi di stato che esistono già.
- Quando il moai è nell'angolo, il fumetto si apre verso sinistra e verso l'alto, dentro la finestra. Non deve prendere clic (`pointer-events: none`).

## Regole delle battute

- Ogni battuta parte da un'azione dell'utente, mai da sola. La bolla di gomma automatica e l'addormentarsi non parlano.
- Al massimo una battuta ogni 10 s circa. Una battuta che arriva prima viene scartata, non messa in coda. Mai la stessa variante due volte di fila.
- Niente battute durante l'intro (`afterIntro`).
- Niente fumetti con movimento ridotto, perché il moai è un'immagine ferma. Il pulsante di pausa li zittisce e ferma le animazioni nuove.
- Un fumetto solo alla volta.
- Le stringhe vanno in i18n con id `@@moai.line.<reazione>.<n>`, da aggiungere a mano in `messages.it.xlf`.

## Le reazioni

Le battute sono una proposta: l'autore le rivede nel testo. Dove il testo dice "1–3 varianti", chi costruisce ne scrive almeno due nello stesso tono.

| Quando | Movimento | EN | IT |
|---|---|---|---|
| Copia dell'email (desktop) | nessuno | Talk soon. | A presto. |
| Clic singolo | saltello a scatti (squash e stretch, ~300 ms) + battito di ciglia, subito, senza aspettare un secondo clic | Hey. / Yes? | Ehi. / Sì? |
| Doppio clic (desktop) | bolla di gomma (come oggi), sopra il saltello | Gum gum. | Gomma gomma. |
| Trascinato o girato (alla fine del gesto) | come oggi | Easy, I'm made of stone. | Piano, sono di pietra. |
| Girato molto (più giri in un gesto) | pupille che girano in tondo, testa che oscilla a scatti | Eight hundred years still, and now this. | Ottocento anni fermo, e ora questo. |
| Scosso (trascinato avanti e indietro in fretta) | il pukao scivola, cade a scatti con due rimbalzi, resta a terra ~2 s e torna su | My pukao! | Il mio pukao! |
| Solletico (molti clic in poco tempo) | si gira di spalle e resta immobile ~4 s | Hmph. Not talking to you. | Uffa. Non ti parlo. |
| Scroll molto veloce | starnuto: scatto in avanti e sbuffo di pixel di polvere | Ah… ah… Achoo! | Ah… ah… Etciù! |
| Tema verso scuro | nessuno | Lights off. I'll keep watch. | Luci spente. Faccio io la guardia. |
| Tema verso chiaro | nessuno | Morning already? | Già mattina? |
| Cambio lingua | nessuno | Hello! | Ciao! |
| Codice Konami o Press start | nessuno | I knew you'd find it. | Lo sapevo che l'avresti trovato. |
| Badge Explorer (tutti i case study letti) | nessuno | You read them all. Respect. | Li hai letti tutti. Rispetto. |
| Risveglio dopo il sonno | stiracchiata (squash a scatti) | Five more minutes… | Altri cinque minuti… |

Il pukao resta "pukao" in entrambe le lingue (decisione dell'autore). È il cilindro rosso già nel modello (`moai.model.ts`, colore `pukao`, y 22–24).

### La copia dell'email

- Il bottone continua a dire "Copied" / "Copiata" e lo stato per lo screen reader non cambia.
- Su desktop il moai aggiunge "Talk soon." / "A presto.".
- Su telefono il moai è sotto l'About e non si vede dai contatti, quindi il bottone dice tutto: "Copied. Talk soon." / "Copiata. A presto.".

### La gomma come attesa

1. Dopo circa 10 s senza input il moai fa una bolla da sola, che scoppia.
2. Dopo 20 s si addormenta con le z (`SLEEP_MS`, come oggi).

- Una bolla sola per ogni periodo di attesa. Il primo input azzera il conto.
- Il doppio clic e il doppio tap continuano a farla quando vuoi.
- Parte solo se il moai è in vista (nel pin dell'About o nell'angolo) e la pagina non sta scorrendo.
- La pausa la ferma insieme al sonno. Con movimento ridotto non c'è.

### Il risveglio

- Il moai si sveglia con qualunque evento di `WAKE_EVENTS`. Su ogni risveglio si stiracchia e dice "Altri cinque minuti…".
- La battuta parte solo se il moai era in vista mentre dormiva. Se dormiva fuori schermo, si sveglia in silenzio.
- La battuta del risveglio segue il limite di 10 s come le altre.

## Vincoli

- **Prestazioni.** Tutto il codice nuovo vive nel chunk lazy del moai (Three.js) o in funzioni pure minime. Niente nel percorso del primo paint (`afterPaint()`, issue #151). Lighthouse mobile ≥ 0.95 sulla home.
- **Motion.** Valgono `edm-style` e il `CLAUDE.md`: niente con reduced motion, pausa con `MotionPause`, effetti desktop solo da 1024 px con hover. I movimenti nuovi della scena vivono nel loop di `moai-scene.ts`, che si ferma quando il moai è fuori schermo: i tempi che devono finire comunque vanno su timer, come la bolla oggi.
- **Accessibilità.** WCAG 2.2 AA. I fumetti non cambiano nulla di quello che legge lo screen reader. Axe passa in entrambi i temi con un fumetto aperto.
- **Logica testabile.** Il limite di 10 s, il "mai la stessa due volte" e la scelta della variante stanno in una funzione pura con unit test, come `core/theme/theme.ts`. Lo stesso vale per il riconoscimento dei gesti (scosso, molti giri, solletico).

## Lasciato a chi costruisce

- Come arrivano al moai gli eventi da fuori della scena (copia, tema, lingua, Konami, Explorer). Un servizio in root con un segnale è la strada più ovvia.
- Le soglie dei gesti: quanti clic fanno il solletico, quanto deve essere veloce lo scroll per lo starnuto, quanti giri fanno il capogiro, cosa conta come scuotere.
- La forma precisa del fumetto e dello sbuffo di polvere, nel rispetto di `edm-style`.
- Come si divide il lavoro in pull request. Suggerimento: (1) il moai su tutte le pagine; (2) fumetto, regole, copia, clic singolo, risveglio; (3) gomma come attesa; (4) pukao, capogiro, solletico, starnuto ed eventi globali.
- Come il moai passa dalla home alle altre pagine: componente nella shell dell'app oppure per pagina. Vale il vincolo di una scena sola.

## Scelte mie, da confermare leggendo

- Il testo delle battute nuove (capogiro, pukao, solletico, starnuto, tema chiaro) e il tono "pietra".
- La battuta del tema anche verso il chiaro, non solo verso lo scuro.
- Una battuta che arriva prima dei 10 s viene scartata, non messa in coda.
- Il pukao torna da solo dopo ~2 s.
- Il trascinamento parla alla fine del gesto, non all'inizio.
- "Gum gum." / "Gomma gomma." (decisione dell'autore) è una battuta sola, senza varianti. Esce con il doppio clic. La bolla automatica dell'attesa resta muta, perché le battute partono solo da un'azione dell'utente.
- Doppio clic: il primo clic fa il saltello, il secondo fa partire la gomma senza un secondo saltello. Il rilevamento usa `DOUBLE_TAP_MS` e `DOUBLE_TAP_PX`, come oggi.
- Il limite di 10 s vale per tutte le battute. Fanno eccezione la copia dell'email, il Konami e Press start, che sono rari e voluti: passano sempre e sostituiscono il fumetto aperto. Lo scarto dei 10 s vale per le battute che arrivano dopo di loro.
- Un evento che arriva quando il moai non è caricato o non è in vista (sopra l'About, telefono, fuori schermo) viene scartato, non messo in coda.
- Le battute del tema partono solo dal bottone del tema, non dal cambio di tema del sistema né dal tema al caricamento.
- In pausa non compare nessun fumetto, nemmeno quello della copia: il bottone dice comunque "Copied".
- Sul telefono, delle reazioni nuove resta solo il saltello al tocco singolo. Nessun fumetto, nessuno starnuto, niente pukao né solletico.
- Le battute stanno in `$localize` nel chunk lazy del moai: l'estrazione e la build localizzata li vedono come le stringhe dei template.

## Verifica

E2E (Playwright, desktop salvo dove detto):
- Dopo la copia compare il fumetto del moai, e il messaggio di stato del bottone non cambia.
- Telefono: la conferma completa è sul bottone e non compare nessun fumetto.
- Nessun fumetto al caricamento, durante l'intro, con movimento ridotto o in pausa.
- Nessun fumetto in più entro la finestra minima tra due battute.
- Il fumetto ha `aria-hidden="true"` e sparisce da solo.
- Con il clock di Playwright: la bolla compare dopo 10 s senza input e le z dopo 20 s. Un movimento del mouse prima dei 10 s rimanda la bolla. In pausa o con movimento ridotto la bolla non compare.
- Un clic fa saltare il moai senza far uscire la gomma. Un doppio clic fa uscire la gomma.
- Dopo 20 s compaiono le z. Uno scroll o un movimento del mouse le toglie e fa comparire la battuta del risveglio. Il moai che dormiva fuori schermo si sveglia senza battuta.
- Scuotere il moai fa cadere il pukao, che poi torna.
- Desktop: il moai è nell'angolo su un case study, un articolo e la 404, e non copre link né bottoni.
- Telefono: il moai spunta sopra il footer delle pagine diverse dalla home e non c'è nessun fumetto.
- Il badge Explorer fa parlare il moai sul case study che completa la serie.
- Dopo il cambio lingua il moai dice "Ciao!" / "Hello!" sulla pagina nuova, e un semplice ricaricamento non lo fa.
- I test di tempo usano `page.mouse` e il clock, non `locator.click()` (vedi "Lessons from failures" nel `CLAUDE.md`). Le animazioni del canvas si verificano dagli attributi `data-*` dell'host, non dai pixel.

Unit: la funzione delle regole (limite, niente ripetizioni, scarto), il riconoscimento dei gesti.
