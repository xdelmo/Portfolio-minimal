# Portfolio v2 — Design spec

- **Data:** 2026-10-03
- **Autore:** Emanuele Del Monte (con Claude Code)
- **Stato:** in revisione
- **Branch:** `v2` (repo `xdelmo/Portfolio-minimal`)

## 1. Obiettivo

Sostituire il sito attuale (Gatsby + `gatsby-theme-portfolio-minimal`) con un portfolio nuovo, curato e interattivo, il cui scopo è **trovare il prossimo lavoro**: il contratto con IPS S.p.A. scade a marzo 2027 e la ricerca parte a gennaio 2027.

**Pubblico:** recruiter e tech lead, in Italia e per ruoli full remote anche all'estero.

**Criterio di successo:** chi arriva (da LinkedIn, Google o un agente AI) capisce in meno di 30 secondi chi è Emanuele, il suo livello (Frontend Engineer, Angular/Signals, contesto enterprise), vede ApexFlow come progetto di punta e sa come contattarlo.

**Scadenza:** online nella **prima metà di dicembre 2026**, con margine prima di gennaio.

## 2. Vincoli e decisioni

| Tema | Decisione |
|---|---|
| Framework | Ultima versione stabile di Angular (da verificare allo scaffolding), standalone, zoneless, Signals, `@angular/ssr` in modalità di output statica (prerender) |
| Stili | **SCSS** (non CSS) per stili globali e di componente; i token restano variabili CSS custom (servono a runtime per il tema), SCSS si usa per partial, mixin e breakpoint |
| Qualità del codice | **ESLint in strict mode** su tutto il progetto: `angular-eslint` + `typescript-eslint` con le configurazioni `strictTypeChecked` e `stylisticTypeChecked`, regole template e accessibilità di Angular; `npm run lint` senza errori né warning è un criterio di accettazione e gira in CI |
| Hosting | Netlify, dominio `www.emanueledelmonte.it` |
| Repo | Stesso repo, branch `v2`; il sito Gatsby resta online fino al merge su `master` |
| Lingue | IT + EN, rilevamento dalla lingua del browser + selettore manuale |
| Tema | Light + dark, rilevamento dal sistema operativo + toggle manuale |
| Direzione visiva | "Pixel field": base pulita, campo di pixel pastello interattivo nell'hero |
| Riferimenti | matteovincenti.com (etichette monospace, oggetto 3D trascinabile, numeri grandi), marimba.design (fondo morbido, colonne di griglia, pastelli), craft.wild.as (campo di pixel, titolo maiuscolo stretto) |
| 3D | Moai voxel (mascotte, richiamo al 🗿 del sito attuale) in Three.js, **nella v1** |
| Località | "Latina, IT / Remote" |
| CV | **Non pubblicato** (contiene dati sensibili). Nessuna menzione nel sito (tolta su richiesta il 2026-10-04) |

## 3. Struttura e contenuti

URL: `/it/…` e `/en/…`. Home a scorrimento + una pagina per ogni case study.

| # | Sezione | Contenuto | Effetto |
|---|---|---|---|
| 01 | Hero | "Frontend, engineered." · ruolo, stack, Latina/Remote · badge "Disponibile da marzo 2027" · CTA "Work" e contatti | Pixel field |
| 02 | About | Come ragiona (tono alla Matteo Vincenti), numeri grandi, blocco "At a glance" | Moai voxel |
| 03 | Selected work | Card grandi dei progetti principali | Reveal, pixelate on hover, View Transition verso il case study |
| 04 | Side quests | Griglia piccola dei progetti personali "nerd" | Reveal |
| 05 | Experience | Timeline: IPS S.p.A. (tirocinio → Frontend Specialist), Flexie (lavoro professionale), Laurea in Ingegneria Informatica 2026 (Università Mercatorum), certificazioni (Flutter, Agile) | Linea che si disegna allo scroll |
| 06 | Stack | Angular, Signals, RxJS, TypeScript, PrimeNG, Tailwind, Spring Boot… | Icone in pixel art |
| 07 | Contact | Email, LinkedIn, GitHub | — |

### 3.1 Progetti principali (card + case study)

| Progetto | Repo | Note |
|---|---|---|
| **ApexFlow** (in evidenza) | `dashboard-tesi`, `backend-tesi` | Angular 19 + Signals + RxJS + PrimeNG; Spring Boot 3 / Java 21 + PostgreSQL. Demo su Vercel |
| **Ice Friends Breaker** | `ice-friends-breaker` | Next.js 16, Supabase, PWA + Capacitor. Demo su Vercel |
| **MCP Server** | `mcp-server` | Server e client Model Context Protocol in Python |
| **Telegram bots** (una card) | `auto-scadenze-bot`, `hoenn-binder`, `presenz-lazy-bot` | Automazioni personali |

Le repo private verranno rese pubbliche dall'utente **dopo** una scansione dei segreti (vedi Fase 0).

Struttura di un case study: problema → architettura → scelte tecniche (es. Signals vs RxJS, `TablePaginationState`, perché Spring Boot) → risultato → link a demo e repo. I post LinkedIn esistenti sono la bozza dei testi.

### 3.2 Side quests

PokèVerba (`pokeverba-site`, WordPress + React), oggetti CAD parametrici stampati in 3D (`magsafe-cardholder`, `volkswagen-up-door-storage-box`).

### 3.3 Esclusi

- `web-crawler-fansales` (aggira protezioni anti-bot: messaggio sbagliato per un recruiter).
- Esercizi di Scrimba, FreeCodeCamp e Frontend Mentor, vecchi progetti React.

## 4. Identità visiva

### 4.1 Palette

Base: la palette del sito attuale (`theme.css`) + pochi accenti pastello usati **solo** in pixel e illustrazioni, mai in testo o bottoni.

| Token | Light | Dark |
|---|---|---|
| `--bg` | `#e5e5e5` | `#121212` |
| `--surface` | `#f2f2f2` | `#1c1c1c` |
| `--surface-2` | — | `#252525` |
| `--fg` | `#1d1d1c` | `rgba(255,255,255,.87)` |
| `--fg-muted` | `#555555` | `#aaaaaa` |
| `--accent` (bottoni, pixel) | `#0066d4` | `#0066d4` |
| `--link` (testo d'accento) | `#005fc5` | `#4d9bf0` |
| Pixel | `#0066d4`, `#7fb2ec`, `#b9d5f5`, `#c9b8f5`, `#dccff8`, `#ffc9a8` | `#0066d4`, `#2f86ea`, `#6aa9f2`, `#9d8cf0`, `#c2b4f5`, `#f0a982` |

Contrasti verificati (WCAG AA ≥ 4.5:1): `--link` light 4.8:1, dark 6.5:1; testo bianco su `--accent` 5.4:1; `--fg-muted` light 5.9:1, dark 8.1:1.

**Niente verde:** il verde non fa parte della palette (pixel, fasce, moai, immagini OG). I colori nuovi si scelgono tra grigi, la famiglia del blu `--accent`, lavanda e pesca.

**Fasce di sezione** (piano 7): About e Contatti hanno uno sfondo a tutta larghezza che ridefinisce i token di testo al loro interno.

| Token | Light | Dark |
|---|---|---|
| `--band-pastel-bg` / `-fg` / `-muted` / `-link` (About) | `#b9d5f5` / `#1d1d1c` / `#2f4560` / `#0b4f96` | `#14243b` / `#e8f0fa` / `#a9bdd6` / `#9ccaff` |
| `--band-ink-bg` / `-fg` / `-muted` / `-link` (Contatti) | `#1d1d1c` / `#f2f2f2` / `#b8b8b2` / `#9ccaff` | `#0b1f3d` / `#eef4fc` / `#a9bdd6` / `#9ccaff` |
| `--intro-bg` / `--intro-fg` (pannello d'apertura, opaco) | `#1d1d1c` / `#e5e5e5` | `#e0e0e0` / `#121212` |

Contrasto minimo nelle fasce 5.4:1 (link su azzurro).

### 4.2 Tipografia e stile

- Sans pulito per i testi, monospace per etichette e metadati (stile "FIG. 01", "MV / 01"), titoli in maiuscolo stretto ("FRONTEND, ENGINEERED.").
- Font self-hosted in WOFF2 con preload. La scelta precisa dei font va fatta in Fase 1 con la skill `frontend-design`.
- Griglia leggera di sfondo, layout fluido con `clamp()`.

### 4.3 Moai voxel

- Colorazione "pietra neutra + accenti pastello": corpo nei grigi del tema, pukao (cappello) pesca, occhi `--accent`, qualche pixel di muschio in grigio pietra chiaro (niente verde).
- Modello rifinito (più dettaglio del prototipo del brainstorming), definito come griglia di voxel in un file TypeScript (`voxel/moai.model.ts`): niente strumenti né formati esterni da caricare.

## 5. Architettura

```
src/app/
  core/theme/     tema light/dark (signal), persistenza, data-theme su <html>
  core/i18n/      lingua corrente, percorso equivalente nell'altra lingua
  core/seo/       title/meta/canonical/hreflang/JSON-LD per pagina
  content/        dati tipizzati per lingua: projects.it.ts / projects.en.ts, experience, about…
  motion/         direttiva [appMotion] (MotionHost) che carica GSAP in differita ed esegue gli effetti di motion/effects/ in gsap.matchMedia
  pixel-field/    componente Canvas 2D
  voxel/          componente Three.js caricato con @defer (on viewport)
  sections/       hero, about, work, side-quests, experience, stack, contact
  pages/          home, case-study
```

Regole:

- Ogni blocco ha una responsabilità sola e non conosce gli altri; le sezioni li compongono.
- I contenuti sono file TypeScript tipizzati: un'interfaccia comune obbliga IT ed EN ad avere gli stessi campi (errore di compilazione se ne manca uno).
- Three.js usato direttamente (non angular-three), per non dipendere dalla compatibilità di una libreria della community con l'ultima versione di Angular.

## 6. Lingua

- `@angular/localize`, traduzione a build time → due build statiche `/it/` e `/en/`. Testi brevi di UI con attributi `i18n` nei template; contenuti lunghi dai file `content/*.{it,en}.ts` scelti tramite `LOCALE_ID`.
- **Rilevamento:** regola Netlify **solo su `/`** con condizione `Language`: `it` → `/it/`, altro → `/en/` (302).
- **Scelta manuale:** il selettore porta al percorso equivalente nell'altra lingua e imposta il cookie `nf_lang`, che Netlify usa con precedenza sulla lingua del browser.
- `<html lang>` corretto per ogni build.

## 7. Tema

- Script inline nell'`<head>`, eseguito prima del primo rendering: legge `localStorage`, altrimenti `prefers-color-scheme`, e imposta `data-theme` su `<html>` (niente flash).
- Toggle ☀/☾: salva la scelta. Finché l'utente non sceglie, il sito segue i cambi del tema di sistema.
- Tutti i colori sono variabili CSS (§4.1). Pixel field e voxel leggono le stesse variabili e si aggiornano al cambio di tema.
- Toggle tema e selettore lingua sono `<button>`/link veri, usabili da tastiera, con `aria-label` localizzato.

## 8. SEO

- HTML completo prerenderizzato per ogni pagina e lingua.
- Per pagina: `title`, `description`, `canonical`, `hreflang` IT/EN + `x-default` → `/en/`. Il `title` dice la competenza, non solo il nome: home "Emanuele Del Monte — Angular Frontend Engineer" (`content.seo`), case study "Progetto: prime tre tecnologie — Emanuele Del Monte" (`caseStudyTitle`).
- `sitemap.xml` (con alternate per lingua) e `robots.txt` generati a build time.
- Dominio canonico unico `www.emanueledelmonte.it`: 301 dalla versione senza `www` e da `*.netlify.app`.
- JSON-LD:
  - `Person`: nome, `jobTitle`, `worksFor` IPS S.p.A., `alumniOf` Università Mercatorum, `address` Latina, `sameAs` LinkedIn e GitHub, `knowsAbout`, `knowsLanguage`, `description` (una frase citabile, `person.summary`, che apre anche `llms.txt`);
  - `ProfilePage` e `WebSite` sulla home;
  - `BreadcrumbList` e `SoftwareSourceCode` sui case study.
- Immagini Open Graph e Twitter in stile pixel, una per pagina e per lingua.
- HTML semantico: un solo `h1` per pagina, landmark, `alt` ovunque, link descrittivi.
- Fuori dal sito: Google Search Console + Bing Webmaster con invio della sitemap; link al sito da LinkedIn, dal README del profilo GitHub e dai README delle repo rese pubbliche.

## 9. Ottimizzazione per agenti e motori AI (GEO)

- Tutto il contenuto significativo è testo nell'HTML statico (pixel field e voxel sono decorativi, `aria-hidden`).
- `robots.txt` ammette esplicitamente GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, Claude-User, PerplexityBot, Google-Extended, Applebot-Extended.
- Identità coerente tra sito, JSON-LD, LinkedIn e GitHub (stessi nome, ruolo, città, link). Il piano include l'allineamento del titolo LinkedIn e del README del profilo GitHub.
- In ogni pagina, all'inizio, frasi fattuali e autonome + blocco "At a glance" (ruolo, stack, esperienza, lingue, disponibilità).
- `/llms.txt`, `/llms-full.txt` e versione Markdown di ogni pagina (`/en/work/apexflow.md`), generati dagli stessi file di contenuto.
- Verifica (indicatore, non criterio di accettazione): qualche settimana dopo il lancio, interrogare ChatGPT, Perplexity e Claude con ricerca web attiva.

## 10. Movimento e 3D

### 10.1 Strumenti

- GSAP 3.15 + ScrollTrigger + SplitText, in un pacchetto caricato in differita (~47 KB gzip) tramite il token `MOTION_LOADER`. Lenis non è stato adottato: lo scroll resta quello nativo.
- View Transitions API tramite `withViewTransitions()` del router Angular (card → case study).
- La direttiva `[appMotion]` (`src/app/motion/motion-host.ts`) parte in `afterNextRender()` (mai sul server), esegue ogni effetto di `src/app/motion/effects/` in `gsap.matchMedia` dentro un `try/catch`, raccoglie le funzioni di pulizia che gli effetti restituiscono e fa `mm.revert()` alla distruzione. Condizioni: `motion` = `prefers-reduced-motion: no-preference`; `desktop` = `min-width: 1024px` e `hover: hover`.
- Per le animazioni legate allo scroll si usa `gsap.set(stato iniziale)` + `.to()`: in Firefox un `.from()` con `scrub` non viene ridisegnato dopo il refresh di ScrollTrigger.

### 10.2 Per sezione

Stato attuale (piani 3, 4 e 7; riferimenti: matteovincenti.com e marimba.design):

| Sezione | Desktop (≥ 1024 px con hover) | Mobile |
|---|---|---|
| Intro | una volta per sessione: pannello opaco, lettere del nome e una fila di pixel pastello, poi il pannello sale; riserva CSS a 3 s; mai con riduzione del movimento | assente (ritardava il primo paint: Lighthouse prestazioni 0.92) |
| Hero | pixel field "edm." con vignettatura ai bordi e pixel che scintillano a caso; dopo l'intro il titolo sale riga per riga; allo scroll il titolo si allarga e sale, il pixel field scende | pixel field e spostamento allo scroll |
| Titoli di sezione | salgono riga per riga con maschera (SplitText), poi tornano testo semplice | idem |
| Work | immagine che si inclina verso il cursore (max 7°), titolo che scorre di 12 px; View Transition | View Transition |
| Experience | sezione bloccata (pin): le voci si impilano come un mazzo di carte, la linea cresce con l'avanzamento | elenco semplice con comparsa dal basso |
| Stack | quattro sfere pastello (una per gruppo) che dal disordine si dispongono su un anello | idem |
| About | fascia azzurra a tutta larghezza; moai voxel che ruota, trascinabile | fascia; moai che ruota da solo |
| Contatti | fascia scura che da scheda arrotondata si allarga a tutta larghezza (mai oltre il bordo del testo); titolo gigante che sale riga per riga | idem |
| Pagina | barra di avanzamento della lettura in alto (3 px, `--accent`) | idem |

Non realizzati rispetto alla prima versione: pin e esplosione del moai, effetto "scramble", icone pixel art dello stack, Lenis.

### 10.3 Voxel tecnico

- Three.js `InstancedMesh` (una sola chiamata di disegno), luce emisferica + direzionale, nessuna ombra in tempo reale.
- Caricato con `@defer (on viewport)`; colori presi dalle variabili CSS.
- DPR limitato a 2 su desktop e a 1.5 su mobile.

### 10.4 Pixel field tecnico

- Canvas 2D, `requestAnimationFrame`, funzioni di calcolo pure (testabili).
- Fermo quando è fuori schermo (`IntersectionObserver`) o la scheda è nascosta (`visibilitychange`).
- Dimensioni riservate fin dall'inizio (CLS = 0).

## 11. Robustezza e accessibilità

- **Miglioramento progressivo:** il contenuto non dipende dagli effetti e funziona anche con JavaScript disattivato.
- **Isolamento degli errori:** ogni effetto parte in `try/catch`. Eccezioni, `webglcontextlost` o un pacchetto Three.js non scaricato portano all'immagine statica di riserva. Un `ErrorHandler` globale registra senza bloccare.
- **Lo scroll non viene mai bloccato.** Pin solo su desktop (`gsap.matchMedia()`); sul moai, su mobile, `touch-action: pan-y`.
- **iOS:** `svh`/`dvh` al posto di `100vh`, `ScrollTrigger.config({ ignoreMobileResize: true })`, `ScrollTrigger.refresh()` al cambio di orientamento.
- **`prefers-reduced-motion`:** GSAP non viene nemmeno caricato (`data-motion="off"`), niente intro, pin o spostamenti. Pixel field come immagine statica, moai come immagine statica pre-renderizzata. Stesso contenuto.
- **Layout fluido** 320–2560 px, nessuno scroll orizzontale.
- **Browser supportati:** ultime 2 versioni di Chrome, Edge, Firefox e Safari; iOS Safari 16+.
- **Accessibilità — conformità WCAG 2.2 livello AA su tutto il sito** (ogni pagina, entrambe le lingue, entrambi i temi, desktop e mobile). Requisito vincolante: nessuna funzionalità può essere rilasciata se viola un criterio A o AA. In particolare:
  - **1.4.3 / 1.4.11** contrasto testo ≥ 4.5:1 (≥ 3:1 per testo grande) e componenti/indicatori di focus ≥ 3:1, verificati in light e dark (§4.1);
  - **1.4.10 Reflow** a 320 px senza scroll orizzontale; **1.4.12 Text spacing** senza perdita di contenuto; **1.4.4** zoom al 200%;
  - **2.1.1 / 2.1.2** tutto usabile da tastiera, nessuna trappola (anche il moai: rotazione da tastiera o alternativa statica); **2.4.1** link "Vai al contenuto"; **2.4.3** ordine del focus logico;
  - **2.4.7 / 2.4.11 / 2.4.13** focus sempre visibile e mai coperto da header fissi o animazioni;
  - **2.2.2 Pausa, stop, nascondi**: le animazioni automatiche che durano più di 5 secondi (pixel field, moai) hanno un controllo per fermarle, oltre al rispetto di `prefers-reduced-motion`; **2.3.1** niente lampeggi;
  - **2.5.7 Dragging**: ogni azione di trascinamento ha un'alternativa senza trascinamento; **2.5.8 Target size** ≥ 24×24 px (obiettivo interno 48×48 per i controlli principali);
  - **1.1.1** testo alternativo per immagini significative, elementi decorativi `aria-hidden`; **1.3.1** landmark e titoli strutturati; **3.1.1 / 3.1.2** `lang` della pagina e delle parti in altra lingua; **4.1.2** nome, ruolo e valore di ogni controllo;
  - **3.2.3 / 3.2.4** navigazione e nomi coerenti tra le pagine e tra le lingue.

## 12. Obiettivi misurabili (criteri di accettazione)

- **Lighthouse mobile, ogni pagina, entrambe le lingue:** SEO 100 · Accessibilità 100 · Best Practices 100 · Performance ≥ 95.
- **JavaScript iniziale** < 150 KB gzip (Three.js e GSAP in pacchetti differiti).
- **Core Web Vitals:** CLS = 0, LCP sul titolo dell'hero.
- **axe:** 0 violazioni con i tag `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`, in light e in dark.
- **Verifica manuale WCAG 2.2 AA** prima del lancio: navigazione completa da tastiera, VoiceOver (macOS e iOS), zoom 200%, text spacing, `prefers-reduced-motion`; checklist nel piano di lancio.
- **Nessun errore in console** su tutti i browser della matrice di test.
- **`npm run lint`** (ESLint strict) senza errori né warning.

## 13. Test

- **Unit test** (runner generato dalla CLI di Angular) sulla logica: servizio tema (scelta salvata contro sistema), corrispondenza dei percorsi tra lingue, funzioni di calcolo del pixel field.
- **Playwright**, progetti: Chromium desktop, Firefox, WebKit desktop, iPhone emulato (WebKit), Android emulato (Chromium). In ognuno:
  - home e case study in IT ed EN si caricano senza errori in console;
  - scroll fino al fondo con tutte le sezioni visibili;
  - nessuno scroll orizzontale a 320, 375, 768, 1024, 1440 e 1920 px;
  - il toggle del tema salva la scelta; il selettore della lingua porta al percorso equivalente;
  - con `prefers-reduced-motion` compaiono le immagini statiche;
  - **test di guasto:** WebGL disattivato → immagine del moai, pagina scorrevole; richiesta del pacchetto Three.js bloccata → idem; JavaScript disattivato → contenuto presente;
  - axe senza violazioni.
- **Lighthouse CI** sulle anteprime Netlify con le soglie di §12: la PR fallisce se una pagina scende sotto soglia.
- **Prova manuale prima del lancio** su un iPhone e un Android veri, con checklist (scroll, rotazione, tema, lingua, moai, link).

## 14. Deploy

- Anteprime Netlify per il branch `v2`: `https://v2--emanueledelmonte.netlify.app`. Redirect di lingua e di dominio in `netlify.toml`.
- Il sito Netlify aveva il plugin `@netlify/plugin-gatsby` installato dalla UI (per il vecchio sito su `master`): con Angular fa fallire ogni deploy e va rimosso.
- I case study rispondono al loro URL canonico senza slash finale grazie al file `_redirects` che `scripts/postbuild.mjs` genera (rewrite 200 per ogni pagina prerenderizzata); uno slug sbagliato finisce comunque nel 404 della lingua.
- Su `/` gli header `Netlify-Vary: language,cookie=nf_lang` e `Cache-Control: no-store` impediscono alla cache edge di servire a chi ha il cookie `nf_lang` il redirect salvato per chi non ce l'ha.
- Lancio: merge di `v2` su `master`.

## 15. Fasi

| Fase | Periodo | Contenuto | Skill di riferimento |
|---|---|---|---|
| 0 · Preparazione | ott, sett. 1 | scansione dei segreti nelle repo da rendere pubbliche; scaffolding Angular; anteprima Netlify attiva | `angular-developer` |
| 1 · Fondamenta | ott, sett. 1–2 | variabili di colore, tipografia, tema, i18n, layout, SEO di base (meta, JSON-LD, sitemap, robots) | `angular-developer`, `frontend-design`, `web-design-guidelines` |
| 2 · Contenuti | ott, sett. 3 → nov, sett. 1 | tutte le sezioni con testi reali IT/EN, case study di ApexFlow (poi gli altri) | `frontend-design` |
| 3 · Pixel field | nov, sett. 1–2 | canvas hero, interazione, immagine di riserva | `gsap-*`, `review-animations` |
| 4 · Moai voxel | nov, sett. 2–4 | modello rifinito, rotazione allo scroll, trascinamento, esplosione, immagine di riserva. **Fase isolata:** se slitta, si lancia con l'immagine statica | `threejs-*`, `gsap-scrolltrigger`, `review-animations` |
| 5 · Rifiniture | fine nov | animazioni allo scroll, immagini OG, `llms.txt` e Markdown, controllo di prestazioni e accessibilità, test sui dispositivi | `gsap-performance`, `review-animations`, `web-design-guidelines` |
| 6 · Lancio | inizio dic | merge, Search Console e Bing, link da LinkedIn e GitHub, allineamento dei profili | — |

## 16. Backlog v2 (escluso dalla v1)

Tracciato anche nelle issue GitHub con etichetta `v2`:

- **Blog** dai post LinkedIn — [#1](https://github.com/xdelmo/Portfolio-minimal/issues/1)
- ~~**Easter egg in stile videogioco** (codice Konami, livello, XP, achievement) — [#2](https://github.com/xdelmo/Portfolio-minimal/issues/2)~~ fatto nel piano 10
- ~~**Pagine Privacy e Imprint** — [#3](https://github.com/xdelmo/Portfolio-minimal/issues/3)~~ Privacy fatta il 2026-10-06 (`/privacy`, dal footer); l'imprint non serve per un sito personale non commerciale in Italia. Statistiche rimandate: quando si aggiungono (senza cookie, dati in UE), la pagina Privacy va aggiornata.

Per i prossimi sviluppi: le domande aperte (titolo ufficiale, livello delle lingue, repo da rendere pubbliche) e la pulizia che richiede l'utente (issue #2 da chiudere, branch remoti mergiati) stanno in `docs/launch/launch-kit.md` §7 e §8. Il blog parte solo dai post originali dell'utente.

## 17. Modifiche rispetto alla spec originale

| Data | Modifica | Perché |
|---|---|---|
| 2026-10-04 | Motion con GSAP lazy (piano 7) al posto delle rivelazioni solo CSS | richiesta esplicita: effetto "wow" come matteovincenti.com e marimba.design |
| 2026-10-04 | Intro di apertura, solo desktop e una volta per sessione | su mobile peggiorava FCP/LCP e il contrasto misurato da Lighthouse |
| 2026-10-04 | Experience come mazzo di carte bloccato invece della linea che si disegna | più vicino ai riferimenti; pin solo ≥ 1024 px |
| 2026-10-04 | Stack come sfere pastello su un anello invece delle icone pixel art | stesso motivo; una sfera per gruppo |
| 2026-10-04 | Fasce colorate per About e Contatti | ritmo tra le sezioni come nei riferimenti |
| 2026-10-04 | Verde tolto dalla palette (`--px-5` ora lavanda, muschio del moai grigio) | il verde non fa parte della palette |
| 2026-10-04 | Pixel field con vignettatura e scintillio casuale (PR #4) al posto dell'onda diagonale | si fonde con la pagina invece di stare in un rettangolo |
| 2026-10-04 | `_redirects` generato in build per i case study | Netlify rispondeva 301 verso l'URL con slash finale |
| 2026-10-04 | `Netlify-Vary` sulla radice | la cache edge mescolava i redirect di lingua con e senza cookie |
| 2026-10-04 | Navbar sempre visibile (sticky, 64 px su mobile, 96 px da md) con `scroll-padding-top` per ancore e focus; il pin dell'Experience parte sotto la navbar | richiesta esplicita |
| 2026-10-04 | Tolta la voce Flutter Bootcamp dall'Experience | richiesta esplicita |
| 2026-10-04 | Tolte le frecce di rotazione sotto il moai (resta pausa/riproduci su mobile per WCAG 2.2.2) | richiesta esplicita |
| 2026-10-04 | Cambio tema con un cerchio che si allarga dal pulsante su tutta la viewport (View Transitions; niente con riduzione del movimento) e icona animata all'hover | richiesta esplicita |
| 2026-10-04 | Selettore lingua come menu a tendina (`<details>`, funziona senza JS; Esc e clic fuori lo chiudono) | il link "Italiano"/"English" da solo non diceva cosa faceva |
| 2026-10-04 | Tolto il lampo pixelato sulle immagini dei progetti all'hover (e le copie `-40.jpg`) | richiesta esplicita |
| 2026-10-04 | Titolo dell'hero in italiano accorciato ("Interfacce Angular veloci anche con molti dati."); disponibilità ridotta a "ruoli da remoto" (tolti "in sede" e "da marzo 2027") | richiesta esplicita |
| 2026-10-04 | Piano 8 "sito con vita propria" (spec `2026-10-04-portfolio-v2-living-site-design.md`): "edm." diventa il volto di Emanuele, sfere pastello dietro tutto il sito, cursore-pixel ed elementi magnetici, stack che galleggia, moai che respira e guarda il cursore, scramble del menu | richiesta esplicita: più animazioni, un sito con vita propria, la foto di Emanuele |
| 2026-10-04 | Un solo pulsante "Metti in pausa le animazioni" nell'header al posto di quelli del pixel field e del moai | WCAG 2.2.2 con un controllo unico |
| 2026-10-04 | Foto (`public/images/emanuele.jpg`) nel JSON-LD `Person.image` | identità per motori e agenti AI |
| 2026-10-04 | Dev server con `baseHref` per lingua e proxy tra 4200 e 4201 | il cambio lingua non funzionava in sviluppo |
| 2026-10-04 | Cambio lingua con una tenda `--accent` a tutto schermo, a gradini pixel, con il nome della lingua: copre la pagina in uscita e si alza su quella nuova; niente tenda con riduzione del movimento | richiesta esplicita |
| 2026-10-04 | Favicon "e." pixel (SVG, ICO 16/32/48, apple-touch-icon 180) al posto di quella di default di Angular | mancava la favicon |
| 2026-10-04 | Foto di Emanuele nei Contatti; tolta la riga "CV disponibile su richiesta"; il footer prosegue la fascia scura dei Contatti (niente striscia di sfondo in mezzo) | richiesta esplicita |
| 2026-10-04 | Dropdown della lingua: testo delle voci allineato all'etichetta del pulsante, quadratino della lingua attiva nella colonna dell'icona | spazi non coerenti |
| 2026-10-04 | Il campo di pixel dell'hero mostra solo il volto: niente più "edm.", niente ciclo né morph; i pixel del ritratto si compongono in volo, poi scintillio, spinta del cursore e onde al tocco | richiesta esplicita |
| 2026-10-04 | Occhi del moai che seguono il cursore (desktop): ogni occhio 2×2 diventa bianco con una pupilla accento nel quadrante del puntatore, oltre alla rotazione della testa | richiesta esplicita |
| 2026-10-05 | Foto dei Contatti ritagliata in un cerchio a gradini sulla griglia pixel (16 celle, `mask` SVG) | richiesta esplicita: una mask sferica |
| 2026-10-05 | Le sfere dello Stack entrano dai bordi dello schermo senza essere tagliate dalla colonna centrale: il clip orizzontale sta su `html` | le sfere apparivano tagliate |
| 2026-10-05 | I progetti portano al codice su GitHub: link alle repo nella lista Progetti, repo come pulsanti principali nei case study (la demo viene dopo), link alla repo per ogni side quest; anche alle repo ancora private, che Emanuele renderà pubbliche | richiesta esplicita: non tutti i progetti sono online |
| 2026-10-05 | Piano 9 "un filo di pixel" (spec `2026-10-05-portfolio-v2-pixel-thread-design.md`): filo con nodi lungo la home, cuciture di pixel su About, Contatti e fondo dell'hero, volto sopra il titolo su telefono, immagini dei progetti che si liberano da un velo di pixel, About con una frase grande che si accende parola per parola e "In breve" senza scheda, esperienza a schede impilate su telefono, tocco sulle sfere dello stack, swipe sul moai | richiesta esplicita: mobile senza interazioni e sezioni scollegate; About da migliorare; riferimenti matteovincenti, marimba, craft.wild.as |
| 2026-10-05 | Tenda del cambio lingua fluida: un pannello che scorre con `transform` (animato dal compositor) con bordi a pixel, al posto del `clip-path` a 9 gradini; il router non fa più la View Transition alla prima navigazione (`skipInitialTransition`), che sfumava ogni pagina appena caricata sopra la tenda | "l'animazione di cambio lingua non è assolutamente fluida" |
| 2026-10-05 | Il filo di pixel finisce dove comincia la fascia dei Contatti (5 nodi, l'ultimo agli Strumenti): il finale è l'arrivo del percorso, non un'altra tappa | richiesta esplicita |
| 2026-10-05 | Hero: tolto il volto in pixel (e lo script `npm run portrait`); resta solo il campo astratto di puntini pastello, a tutta larghezza dietro il testo su desktop (attenuato sotto la colonna del testo) e in una fascia sopra il titolo su telefono | "non mi piace la mia faccia pixelata nella hero"; scelta "Solo campo astratto" |
| 2026-10-05 | Sezioni sotto la hero: ordine Progetti, About (fascia azzurra), Esperienza, Side quest (nuova fascia lavanda), Strumenti, Contatti (fascia scura), così pagina e fasce si alternano; spazio tra sezioni da 192 a 128 px e tra progetti da 96 a 64 px, testo dei progetti centrato sull'immagine; side quest come inventario di un videogioco, ognuna con uno sprite 16 × 16 che si compone allo scroll e salta al passaggio o al tocco | "troppo vuote/monotone", "side quest anonime"; proposta A |
| 2026-10-05 | Tipografia: il testo piccolo (`--step--1`) torna a 14,4 px (era 12,8: `rem` conta dai 16 px della radice); h2 e h3 fluidi, 32→44 px e 22,5→28 px, così su telefono restano ben sotto il titolo dell'hero. Animazioni su telefono: la scheda dell'esperienza coperta arretra sotto la successiva, i progetti arrivano inclinati e si raddrizzano con lo scroll con il titolo che scivola dentro, pulsanti e link alle repo si premono di 2 px al tocco | "aggiungi animazioni sulla versione mobile"; "rivedi gli spazi e la tipografia della versione desktop e mobile" |
| 2026-10-05 | Easter egg "Press start" (issue #2, piano 10): codice Konami o cinque tocchi sul logo aprono una scheda giocatore (classe, livello, punti esperienza verso il ruolo successivo, tre obiettivi in pixel art); le sfere degli Strumenti passano sotto la fascia lavanda, il filo resta sopra; etichette delle sfere centrate su telefono | goal "crea piani in modo indipendente"; "i testi non mi sembrano centrati nei pallini" |
| 2026-10-05 | Tolti il velo di pixel sulle immagini dei progetti e la barra di avanzamento sotto la navbar; lista delle lingue senza padding; su telefono il campo di pixel sta dietro i testi dell'hero; paragrafo About tutto in prima persona | richieste esplicite |
| 2026-10-05 | Il moai fa una bolla di gomma da masticare rosa (`--gum`) al doppio clic o doppio tocco | "al doppio click il moai deve fare una bolla con la gomma da masticare rosa" |
| 2026-10-05 | Tolta l'esplosione in cubi del moai a fine sezione; la bolla di gomma esce dalle labbra (prima nasceva sul naso); i divisori di pixel si sgretolano anche in uscita, mentre salgono verso la navbar (anche quello in fondo all'hero) | "elimina l'animazione di uscita del moai"; "la bolla esce dal naso e non dalla bocca"; "i pixel a fine sezione devono avere animazione anche in uscita" |
| 2026-10-05 | Contatti e footer (piano 11, confronto con matteovincenti.com, marimba.design, craft.wild.as): una frase su cosa scrivermi con la disponibilità; il titolo gigante è il link email, con una freccia a pixel; LinkedIn e GitHub come tag con marchio a pixel; niente indirizzo stampato; footer con © anno, "Back to top", Email, LinkedIn, GitHub e un tasto "Press start" che apre la player card. La foto resta | "come possiamo migliorare la sezione contatti e footer?", "la foto deve comunque rimanere", "l'email con il bottone non mi piace", "manca l'icona linkedin pixelata come github" |
| 2026-10-06 | Strumenti per livelli (piano 12) al posto delle quattro sfere: anelli concentrici con gli strumenti come tag (ogni giorno al centro, in produzione intorno, progetti personali fuori), righe a gradini con un indicatore a pixel su telefono; via galleggiamento, repulsione e tocco delle sfere. Divisione nei livelli ricavata dai contenuti | "come migliorare la sezione dei tools? vedi i 3 siti riferimento" (scelta A) |
| 2026-10-05 | GSAP caricato dopo il primo paint (`afterPaint`), niente `priority` né `modulepreload` nell'head, immagini dei progetti ricompresse (PR #12) | Lighthouse Performance 0.94 sulla home: tutto ciò che parte prima del primo paint entra nel percorso dell'LCP |
| 2026-10-06 | Titoli e descrizioni per i motori di ricerca e gli agenti AI: il titolo della home nomina la competenza (Angular), quelli dei case study le prime tre tecnologie; `Person` con una frase citabile e le lingue (PR #19) | "controlla tutti i testi in modo che trasmettano qualcosa e che siano seo e geo friendly"; gli altri testi erano già specifici |
| 2026-10-06 | Pulizia: via il token `--orb-ink` e `@angular/forms`, mai usati dopo il piano 12; worktree e branch locali mergiati rimossi (PR #20) | "fai un controllo generale su tutta la repo" |
| 2026-10-06 | Esperienza a capitoli (piano 13, spec `2026-10-06-portfolio-v2-experience-chapters-design.md`): solo i lavori nel mazzo, in ordine cronologico (finisce sul ruolo attuale), ognuno con punti, tag e link al case study; laurea e certificato in "Studi e certificati"; sopra il mazzo una traccia a capitoli a pixel che si riempie e porta alla carta con un clic | "la sezione esperienza è scarna sia di contenuto che di interazione"; date solo per anni |
| 2026-10-06 | About con l'uso quotidiano di Claude Code e il server MCP come prova; Claude Code tra gli strumenti di ogni giorno, MCP nei progetti personali (PR #24) | "sarebbe da aggiungere qualche riferimento allo studio e utilizzo della AI?" |
| 2026-10-06 | Pagina Privacy bilingue (`/en/privacy`, `/it/privacy`), linkata dal footer, `noindex`: dice esattamente cosa tiene il sito nel browser (cookie `nf_lang`, `theme`, tre voci di sessione), l'hosting Netlify, l'email, i diritti GDPR e il Garante. Nessuna statistica per ora | "Analytics + privacy" → scelta "Solo privacy, analytics dopo"; issue #3 |
| 2026-10-06 | Studi e certificati come obiettivi sbloccati: due tessere affiancate (una sotto l'altra su telefono), ognuna con lo sprite 16×16 della scheda giocatore (tocco per la laurea, trofeo per il quiz Agile) che si compone allo scroll, ente e anno su una riga; via la colonna con l'anno ripetuto | "c'è da migliorare la parte di Studi e certificati" |
| 2026-10-06 | Un solo ritmo verticale nella home: 64 px sopra i titoli e sotto i contenuti, più i 48 px della cucitura quando segue una fascia; il mazzo dell'Esperienza tiene la sua altezza naturale invece di riempire lo schermo | "quello spazio in alto e niente sotto non mi piace" |
| 2026-10-06 | Testi allineati al profilo LinkedIn: agenzia 2022 – 2024 con Angular, Next.js e WordPress; tirocinio IPS con ApexFlow costruita nel team; ruolo attuale nel gestionale per la cybersecurity (Signals, facade su NgRx, query builder su Kendo Grid, player video); NgRx al posto di PrimeNG tra gli strumenti di ogni giorno; Agile Masterclass Joinrs 2025; nuova tessera per i corsi Anthropic Academy (sprite terminale, tre tessere affiancate da 1024 px); lingue nel blocco "At a glance" | "fai fact check sui testi, dati certificati ecc con mio profilo linkedin" |
| 2026-10-06 | Moai su desktop: sticky sotto l'header (prima finiva 32 px sotto di esso), alto fino a 26rem invece di 22rem senza perdere il pin accanto al testo; allo scroll si gira verso chi legge a metà sezione invece di mostrare il profilo | "il moai ha dimensioni e comportamento corretti secondo te?" |
| 2026-10-06 | Moai: il canvas è più largo della figura del 30% per lato (`MOAI_BLEED`), con l'inquadratura allargata nella stessa misura, così il moai resta identico all'immagine fissa e la bolla di gomma non viene più tagliata quando il moai è girato; un collo di cubetti rosa unisce la bolla alla bocca (prima, di lato, sembrava staccata) | "la bolla del moai viene tagliata che fa overflow nel container" |
| 2026-10-06 | Cursore a freccia: vicino a un titolo di sezione (`main h2`, entro 160 px dalle parole) il pixel del cursore diventa una freccia a pixel che punta al centro del titolo, in otto direzioni, disegnata a linee su celle da 8 px; sopra le parole torna il pixel, sopra i link resta la cornice. Solo desktop con mouse, mai con movimento ridotto | "voglio anche io l'animazione del cursore che diventa una freccia vicino gli h2 e punta il centro dell'elemento come succede su craft.wild.as" |
| 2026-10-06 | Header firmato: dopo il marchio `edm.` una riga verticale e il nome per intero su due righe in maiuscolo spaziato (eccezione voluta dall'utente al "niente maiuscolo"); sui telefoni il menu lingua mostra il codice (EN/IT) e sotto i 360 px resta solo il marchio. Footer: "Torna su" al centro, con una freccia a pixel verso l'alto | "inserisci nella navbar nome e cognome così", "metti freccie e sposta in centro al footer così" |
| 2026-10-06 | Scheda giocatore senza doppioni: giocatore "Delmo" (non il nome già nell'header), quattro obiettivi che il resto del sito non dice (batteria da oltre dieci anni, raider di World of Warcraft, team pizza, telefoni brickati; fonti: vecchio About, profilo GitHub, post LinkedIn) con tre sprite nuovi; via laurea, Agile e Flutter, già in Studi e Strumenti | "il menu press start contiene molti duplicati" |
| 2026-10-07 | Progetti: ogni progetto ha la stessa cornice 3:2 (screenshot desktop a riempimento, quello verticale contenuto; senza screenshot lo sprite a pixel del progetto: spina per MCP Server, robot per i bot Telegram), così la lista ha un solo ritmo e nessuna colonna resta vuota; il primo invito di ogni progetto è un pulsante primario "Leggi il case study", prima dei link al codice | "la sezione progetti e la sezione che mi convince di meno" |
| 2026-10-07 | Intro: GSAP la riprende solo se la sua timeline (circa 2,1 s) finisce entro la riserva CSS, 3,6 s dall'inizio reale della sua animazione (il primo render, più tardi su una macchina lenta; `introFits`); se lo script di motion arriva tardi (telefono lento, CI WebKit) il CSS completa il sollevamento, invece di tenere la pagina coperta fino a 4,5 s e oltre | CI rossa di #39 su WebKit (`intro.spec`), già vista nel run 37507215877 |
| 2026-10-07 | Responsive (controllo di tutte le pagine a 320/360/390/768/1024/1440, nessun overflow orizzontale): nelle tre colonne degli studi lo sprite sta sopra il testo (a 1024 px le parole andavano a capo ogni due o tre), e sotto i 1024 px il moai è centrato sotto il testo dell'About invece di restare a sinistra di una fascia vuota | "controlla che sia tutto responsivo" |
| 2026-10-07 | Case study senza screenshot (MCP Server, bot Telegram): sotto l'intro lo sprite a pixel del progetto in una cornice 3:2 da 480 px, lo stesso della lista Progetti, così nessuna pagina di progetto resta senza immagine | audit autonomo (goal "capire cosa migliorare e procedi indipendentemente") |
| 2026-10-07 | Cursore a freccia: la freccia compare solo entro 64 px (otto celle) dalle parole del titolo, non più 160, e mai sul titolo dei Contatti, che è già un link e il testo più grande della pagina | "il cursore diventa freccia da troppo lontano rispetto all'h2 e sul quello grande dei contatti non deve apparire" |
| 2026-10-07 | Hero, cerchi al tocco: ogni onda continua a propagarsi finché non svanisce da sola (1,6 s), anche con tocchi rapidi; prima ne restavano al massimo 4 e la quinta cancellava la più vecchia a metà corsa. Resta un tetto di 16 solo contro gli autoclicker (`addRipple`) | "cliccando velocemente sullanimazione della hero section dei pixel, i cerchi concentrici si resettano dopo un certo numero e non continuano a propagarsi" |
| 2026-10-07 | Codice Konami, "level up": quando si apre la scheda giocatore (codice, Press start o cinque tocchi sul logo) e il volto della hero è sullo schermo, quattro onde partono dal suo centro a tempo, ogni 150 ms, come le bacchette che contano l'attacco di un brano (un cenno alla batteria, non dichiarato), e la scheda si apre dopo 0,6 s; fuori vista, con movimento ridotto o in pausa si apre subito. Il trigger annuncia `game:start` sul document, il pixel field risponde con `preventDefault()` (issue #2) | "c'è una issue riguardo il konami code. cosa mi consigli di integrarlo" → "entrambe" |
| 2026-10-07 | Pagina 404 come incontro con un Pokémon selvatico in stile Game Boy: "A wild 404 appeared!" nel box di dialogo che si scrive a scatti, la creatura 404 come sprite a pixel 16 × 16 (`wild404`) con nome, livello e barra PS, e un menu di battaglia (home, lavori, contatti) che si muove anche con le frecce. Solo omaggio allo stile: niente sprite, font o suoni originali | issue #45 |
| 2026-10-07 | 404: la creatura saltella a due fotogrammi (ferma con il pulsante di pausa e con riduci movimento); il menu di battaglia diventa il box 2×2 del gioco nella cornice del sito (doppio bordo, nodi a pixel agli angoli, anche sul box del dialogo): Lavori, Contatti, Zaino (apre la scheda giocatore), Fuggi; le frecce si muovono sulla griglia | "il mostrino in 404 deve muoversi"; "il menù deve essere più simile a questo [box Pokémon] ma coerente con lo stile del sito" |
