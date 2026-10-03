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
| CV | **Non pubblicato** (contiene dati sensibili). Nella sezione Contact: "CV disponibile su richiesta" |

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
| Pixel | `#0066d4`, `#7fb2ec`, `#b9d5f5`, `#c9b8f5`, `#a8e0c8`, `#ffc9a8` | `#0066d4`, `#2f86ea`, `#6aa9f2`, `#9d8cf0`, `#7ccfa8`, `#f0a982` |

Contrasti verificati (WCAG AA ≥ 4.5:1): `--link` light 4.8:1, dark 6.5:1; testo bianco su `--accent` 5.4:1; `--fg-muted` light 5.9:1, dark 8.1:1.

### 4.2 Tipografia e stile

- Sans pulito per i testi, monospace per etichette e metadati (stile "FIG. 01", "MV / 01"), titoli in maiuscolo stretto ("FRONTEND, ENGINEERED.").
- Font self-hosted in WOFF2 con preload. La scelta precisa dei font va fatta in Fase 1 con la skill `frontend-design`.
- Griglia leggera di sfondo, layout fluido con `clamp()`.

### 4.3 Moai voxel

- Colorazione "pietra neutra + accenti pastello": corpo nei grigi del tema, pukao (cappello) pesca, occhi `--accent`, qualche pixel di muschio menta.
- Modello rifinito (più dettaglio del prototipo del brainstorming), definito come griglia di voxel in un file TypeScript (`voxel/moai.model.ts`): niente strumenti né formati esterni da caricare.

## 5. Architettura

```
src/app/
  core/theme/     tema light/dark (signal), persistenza, data-theme su <html>
  core/i18n/      lingua corrente, percorso equivalente nell'altra lingua
  core/seo/       title/meta/canonical/hreflang/JSON-LD per pagina
  content/        dati tipizzati per lingua: projects.it.ts / projects.en.ts, experience, about…
  motion/         direttive GSAP/ScrollTrigger/Lenis (es. [revealOnScroll]) + gsap.matchMedia
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
- Per pagina: `title`, `description`, `canonical`, `hreflang` IT/EN + `x-default` → `/en/`.
- `sitemap.xml` (con alternate per lingua) e `robots.txt` generati a build time.
- Dominio canonico unico `www.emanueledelmonte.it`: 301 dalla versione senza `www` e da `*.netlify.app`.
- JSON-LD:
  - `Person`: nome, `jobTitle`, `worksFor` IPS S.p.A., `alumniOf` Università Mercatorum, `address` Latina, `sameAs` LinkedIn e GitHub, `knowsAbout`;
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

- GSAP + ScrollTrigger + SplitText; Lenis per lo scroll fluido (solo su dispositivi con puntatore fine, non su touch).
- View Transitions API tramite `withViewTransitions()` del router Angular (card → case study).
- Tutto inizializzato in `afterNextRender()` (mai sul server) e ripulito alla distruzione del componente (`gsap.context().revert()`).

### 10.2 Per sezione

| Sezione | Desktop | Mobile |
|---|---|---|
| Hero | pixel che si compongono in "edm.", poi onda; il mouse li respinge e li accende; etichette con effetto "scramble" | onda automatica, un tocco genera un'onda circolare |
| About | moai bloccato (pin) mentre scorre il testo, ruota con lo scroll, trascinabile, esplode in cubetti a fine sezione | niente pin né trascinamento: il moai ruota da solo, animazione semplice all'ingresso |
| Work | card in sequenza, immagine che si "pixela" al passaggio del mouse, View Transition | card in sequenza, View Transition |
| Experience | linea che si disegna allo scroll | idem |
| Stack | icone in pixel art che rimbalzano al passaggio del mouse | statiche |
| Titoli | rivelati riga per riga con maschera | idem |

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
- **`prefers-reduced-motion`:** niente Lenis, pin o esplosione. Pixel field come immagine statica, moai come immagine statica pre-renderizzata. Stesso contenuto.
- **Layout fluido** 320–2560 px, nessuno scroll orizzontale.
- **Browser supportati:** ultime 2 versioni di Chrome, Edge, Firefox e Safari; iOS Safari 16+.
- **Accessibilità:** focus visibile, navigazione completa da tastiera, contrasti di §4.1, elementi decorativi `aria-hidden`.

## 12. Obiettivi misurabili (criteri di accettazione)

- **Lighthouse mobile, ogni pagina, entrambe le lingue:** SEO 100 · Accessibilità 100 · Best Practices 100 · Performance ≥ 95.
- **JavaScript iniziale** < 150 KB gzip (Three.js e GSAP in pacchetti differiti).
- **Core Web Vitals:** CLS = 0, LCP sul titolo dell'hero.
- **axe:** 0 violazioni.
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

- Anteprime Netlify per il branch `v2`. Redirect di lingua e di dominio in `netlify.toml`.
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
- **Easter egg in stile videogioco** (codice Konami, livello, XP, achievement) — [#2](https://github.com/xdelmo/Portfolio-minimal/issues/2)
- **Pagine Privacy e Imprint**, se si introducono analytics o cookie — [#3](https://github.com/xdelmo/Portfolio-minimal/issues/3)
