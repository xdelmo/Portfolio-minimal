---
target: src/app/pages/blog
total_score: 24
max_score: 36
na_heuristics: 10
p0_count: 1
p1_count: 2
target_identity: "file:/Users/emanueledelmonte/development/Portfolio-minimal/src/app/pages/blog"
timestamp: 2026-11-12T07-39-13Z
slug: src-app-pages-blog
---
#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|:-----:|-----------|
| 1 | Visibility of System Status | 2 | La progress bar di lettura (`.reading-progress`) scorre via su desktop a causa della `transform` di GSAP ScrollSmoother su `#smooth-content`. |
| 2 | Match System / Real World | 1 | Il pulsante "Email me" / "Scrivimi una email" apre LinkedIn anziché una mail; la navigazione tra articoli adiacenti inverte la cronologia ("Precedente" porta a un post più recente). |
| 3 | User Control and Freedom | 4 | Navigazione a ritroso pulita ("All articles"), scrolling da tastiera nei blocchi di codice, recupero 404 solido. |
| 4 | Consistency and Standards | 2 | Badge in uppercase monospace in contrasto con la Sentence Case Rule di `DESIGN.md`; pulsante copia del codice a 32px senza target touch da 44px. |
| 5 | Error Prevention | 4 | Controllo difensivo su `navigator.clipboard` via `afterNextRender`; prerendering statico privo di discrepanze di idratazione. |
| 6 | Recognition Rather Than Recall | 2 | Blocchi di codice monocromatici senza evidenziazione sintattica; assenza di byline/autore visibile all'ingresso diretto su mobile. |
| 7 | Flexibility and Efficiency | 3 | Codice navigabile da tastiera (`tabindex="0"`), ma misura limitata a 53ch che forza lo scrolling orizzontale su linee di media lunghezza. |
| 8 | Aesthetic and Minimalist Design | 2 | Oltre 700px di vuoto asimmetrico non risolto a 1280px; assenza dei motivi identitari dell'Arcade (pixel thread, moai); 6 link di uscita concorrenti nel footer articolo. |
| 9 | Error Recovery | 4 | Pagina 404 dedicata ("Post not found") con link di ritorno esplicito e gestione corretta dei metadati SEO. |
| 10 | Help and Documentation | n/a | Non applicabile per una superficie editoriale/portfolio (Read / Experience). |
| **Total** | | **24/36** | **Acceptable (66.7%)** |

#### Design Specificity Verdict

**LLM assessment**: Sebbene i singoli micro-interagibili rispettino la grammatica a step (`steps(2)` sui bordi e `steps(3)` sulla spunta SVG di copia), l'esperienza blog complessiva appare **sottoprogettata e intercambiabile**. Assomiglia a un template markdown minimalista standard (in stile Bear) piuttosto che a una superficie proprietaria dell'Arcade di Emanuele Del Monte. Manca il pixel thread, mancano le cuciture dissolte e non c'è una chiara differenziazione per il codice o la colonna di lettura. Inoltre, compaiono violazioni esplicite delle regole di `DESIGN.md`: etichette in uppercase monospace (`.project-tag`, `.lang-tag`) che violano la Sentence Case Rule, e codice completamente privo di syntax highlighting.

**Deterministic scan**: Il detector automatico ha segnalato 4 avvisi statici (3 `low-contrast` sul footer e 1 `tight-leading` su `.lede`) e 2 advisory (`design-system-color` per l'evoluzione dei token `#dedede` e `#0058b8`).
- **Falsi positivi (100% confermati)**: Il contrasto sul footer calcolato dallo scanner statico è un falso positivo causato dall'incapacità del parser di leggere le variabili CSS di `.band--ink` (il contrasto reale su sfondo scuro è tra 8.5:1 e 9.9:1, conforme a WCAG AAA; axe-core rileva 0 violazioni su tutte le pagine). Anche il `tight-leading` su `.lede` è un falso positivo del parser statico (il browser calcola `line-height: 1.55` e 34.8px).
- **Problema confermato**: In `code-block.ts`, il pulsante `.copy` misura 32px di altezza e non include `@media (pointer: coarse) { min-height: 44px; }`, a differenza degli altri pulsanti del sito.

**Visual overlays**: Scansione eseguita su Chromium headless e verificata tramite suite axe-core (0 violazioni WCAG 2.2 AA). Nessun overlay browser permanente iniettato.

#### Overall Impression
La lettura dei testi è pulita, priva di distrazioni e tecnicamente accessibile, ma soffre di un vuoto strutturale su desktop, di code block eccessivamente angusti e soprattutto di **due gravi difetti di afferenza/UX**: un pulsante email che apre LinkedIn e la navigazione cronologica invertita tra post.

#### What's Working
1. **Architettura sicura e accessibile della Clipboard**: Controllo di `navigator.clipboard` in `afterNextRender`, animazione della spunta SVG in 3 frame a step (`steps(3)`) e annuncio vocale su regione live `role="status"`.
2. **Accessibilità da tastiera sui blocchi di codice**: Attributo `tabindex="0"` sui tag `<pre>`, che risolve WCAG 2.1.1 consentendo lo scorrimento orizzontale del codice da tastiera.
3. **Parità bilingue e idratazione perfetta**: Build statica rigorosa sincronizzata tra `/en/blog/` e `/it/blog/`, 0 errori di idratazione Angular e 0 violazioni axe-core su entrambi i temi.

#### Priority Issues

- **[P0] Affordance Mismatch: il pulsante "Email me" apre LinkedIn**
  - **Perché è critico**: In `ContactPrompt` (`src/app/layout/contact-prompt.ts`), la CTA primaria dice *"Email me"* (in italiano *"Scrivimi una email"*), ma punta a `content.person.linkedin`. Un recruiter pronto al contatto si aspetta l'apertura del client mail e viene invece rimbalzato su una piattaforma esterna con potenziale richiesta di login.
  - **Soluzione**: Modificare il link in `mailto:` con la mail di Emanuele, oppure rinominare la CTA in *"Message on LinkedIn"* / *"Scrivimi su LinkedIn"*.
  - **Comando suggerito**: `/impeccable clarify`

- **[P1] Inversione temporale nella navigazione tra articoli adiacenti**
  - **Perché è critico**: In `article.ts`, `list[i - 1]` è etichettato "Previous post" e `list[i + 1]` "Next post". Essendo l'array ordinato in ordine decrescente (dal più recente al più vecchio), "Previous" apre un articolo *più recente* e "Next" uno *più vecchio*.
  - **Soluzione**: Allineare al modello mentale naturale: `list[i + 1]` è "Previous / Precedente" (data anteriore) e `list[i - 1]` è "Next / Successivo" (data posteriore), o rinominare in "Newer / Older article".
  - **Comando suggerito**: `/impeccable clarify`

- **[P1] Progress bar di lettura intrappolata dal ScrollSmoother su desktop**
  - **Perché è critico**: In `article.ts`, `.reading-progress` usa `position: fixed`. Poiché `app-article` si trova dentro `<div id="smooth-content">`, la `transform` applicata da GSAP ScrollSmoother su desktop fa sì che la barra scorra via con la pagina anziché restare fissa in cima al viewport.
  - **Soluzione**: Spostare l'indicatore di progresso fuori da `#smooth-wrapper` in `app.html` (gestito a livello di layout o router), esattamente come l'header e il tasto back-to-top.
  - **Comando suggerito**: `/impeccable polish`

- **[P2] Code block angusti (53ch) e assenza di Syntax Highlighting**
  - **Perché è critico**: Bloccare i blocchi di codice a `var(--measure)` (53ch ≈ 440px utili) costringe a uno scroll orizzontale continuo anche per righe TypeScript/Java di media lunghezza (45+ caratteri). Inoltre, il codice è un blocco monocromatico difficile da scansionare per un Tech Lead.
  - **Soluzione**: Consentire ai code block di espandersi oltre i 53ch su desktop (es. breakout a 72ch / larghezza contenitore) e introdurre una colorazione sintattica coerente con la palette senza verde (greys, signal blue, lavender, peach).
  - **Comando suggerito**: `/impeccable typeset`

- **[P2] Assenza di byline / autore all'atterraggio diretto sugli articoli**
  - **Perché è critico**: Chi atterra su un post da LinkedIn o Google (specialmente su smartphone, dove l'header mostra solo l'icona moai senza testo) legge un articolo senza sapere chi lo abbia scritto fino al footer finale, violando la regola dei 30 secondi di `PRODUCT.md`.
  - **Soluzione**: Introdurre un byline compatto sotto il titolo (`Emanuele Del Monte · Frontend Engineer`) e una breve biografia autore prima del prompt di contatto finale.
  - **Comando suggerito**: `/impeccable layout`

- **[P2] Target touch ridotto a 32px sul pulsante copia di CodeBlock**
  - **Perché è critico**: In `code-block.ts`, `.copy` è alto 32px senza query `@media (pointer: coarse) { min-height: 44px; }`, risultando poco confortevole su mobile rispetto alle linee guida WCAG 2.5.8.
  - **Soluzione**: Aggiungere l'adattamento touch a 44px come già presente su `article.ts` e `blog-index.ts`.
  - **Comando suggerito**: `/impeccable adapt`

#### Persona Red Flags

- **Alex (Tech Lead / Power User)**: Vuole valutare subito l'architettura del codice. Trova snippet monocromatici compressi in 440px che scrollano orizzontalmente dopo poche parole. Inoltre, il link al case study collegato (ApexFlow) è sepolto a fine pagina sotto altri post e sotto il prompt di recruiting.
- **Jordan (Recruiter al primo accesso)**: Arriva da smartphone tramite LinkedIn. Non vede il nome di Emanuele sopra la piega. Legge l'articolo, clicca entusiasta su "Scrivimi una email" per organizzare un colloquio e viene rimandata a sorpresa su LinkedIn.
- **Sam (Lettore con esigenze di accessibilità)**: Sul blog index trova doppi link per ogni post (titolo e "Read article"). Sul telefono fatica a tappare il pulsante di copia codice alto solo 32px.
- **Target Persona (Engineering Manager)**: Cerca prove di eccellenza frontend in un candidato Lead/Senior. Nota badge in uppercase che contraddicono le linee guida tipografiche del portfolio e una barra di lettura che scompare su desktop a causa di un banale conflitto con ScrollSmoother.

#### Minor Observations
- **Border-left off-grid**: In `article.ts`, il `blockquote` ha `border-left: 3px solid var(--accent-line);`. Sulla griglia a 8px, 3px è off-grid (dovrebbe essere 2px o 4px).
- **Mancanza di anchor permalink sui titoli**: Gli `h2` e `h3` nei post non hanno permalink cliccabili o copiatili per la condivisione rapida di sezioni.
- **Tag uppercase**: `.project-tag` e `.lang-tag` utilizzano `text-transform: uppercase`, violando la regola di `DESIGN.md` che impone il sentence case su tutta l'interfaccia.

#### Questions to Consider
1. *I blocchi di codice dovrebbero rompere la colonna di lettura da 53ch su desktop?* Consentire al codice di respirare fino a 70–80ch eliminerebbe lo scroll orizzontale e valorizzerebbe la complessità enterprise dei progetti.
2. *Perché non riprendere il linguaggio del "Quiet Arcade" anche nel blog?* Una sottile linea a pixel o nodi discreti per la timeline dei post darebbero al blog la stessa identità distintiva del resto del portfolio.
3. *Il link al case study del progetto dovrebbe precedere la CTA di contatto?* Mostrare il progetto reale (es. ApexFlow) prima di chiedere un colloquio rafforzerebbe enormemente la credibilità del candidato.
