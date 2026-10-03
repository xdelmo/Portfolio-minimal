# Portfolio v2 · Piano 1: Fondamenta — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** sostituire il sito Gatsby con uno scheletro Angular 22 statico, bilingue (IT/EN), con tema light/dark, sistema visivo di base, SEO tecnica completa e test automatici, pubblicato come anteprima Netlify sul branch `v2`.

**Architecture:** Angular 22 standalone e zoneless, `@angular/ssr` con `outputMode: "static"` (prerender di ogni pagina), `@angular/localize` con due build `/en/` e `/it/`. La logica che può rompersi (tema, URL tra lingue, link SEO) vive in funzioni pure testate con Vitest. I servizi Angular sono sottili involucri attorno a quelle funzioni. Netlify gestisce redirect di lingua, dominio e vecchi URL.

**Tech Stack:** Angular 22.2 (CLI, SSR, localize), Vitest (runner di `ng test`), Playwright 1.63 + @axe-core/playwright, Lighthouse CI 0.15, Netlify, Node 24, font self-hosted `@fontsource-variable/instrument-sans`.

**Spec:** `docs/superpowers/specs/2026-10-03-portfolio-v2-design.md`

**Piani successivi** (scritti dopo aver completato questo, quando le API reali sono note): Piano 2 Contenuti (Fase 2), Piano 3 Pixel field (Fase 3), Piano 4 Moai voxel (Fase 4), Piano 5 Rifiniture e GEO (Fase 5: immagini Open Graph, JSON-LD `WebSite`/`ProfilePage`/`BreadcrumbList`/`SoftwareSourceCode`, `llms.txt` e Markdown), Piano 6 Lancio (Fase 6). Questo piano copre le Fasi 0 e 1 e il JSON-LD `Person`.

## Global Constraints

- Node `^22.22.3 || ^24.15.0 || >=26` (richiesto da Angular 22): si usa **Node 24**, anche su Netlify (`NODE_VERSION = "24"`) e in CI.
- Dominio canonico: `https://www.emanueledelmonte.it`. URL di pagina: `/en/…` e `/it/…`; la home è `/en/` e `/it/` (con slash), le altre pagine senza slash finale (`/en/work/apexflow`).
- Lingua sorgente dei template: **inglese** (`en`); traduzione `it` in `src/locale/messages.it.xlf`. Ogni stringa di UI ha un ID esplicito `@@…`. `i18nMissingTranslation: "error"`.
- Colori solo tramite le variabili CSS della §4.1 della spec (valori riportati nel Task 2). Testo d'accento sempre `--link`, mai `--accent`.
- Contrasti WCAG AA ≥ 4.5:1 per il testo. Focus da tastiera sempre visibile.
- **Niente CV online.** Località: "Latina, Italy" / "Latina, Italia".
- Nessuna dipendenza nuova oltre a quelle elencate in questo piano.
- Ogni task termina con `npx ng build` verde (regola della skill `angular-developer`) oltre ai propri test.
- Messaggi di commit in stile conventional commits, chiusi da `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Storage bloccato** (Safari privato, cookie disabilitati): lo script del tema e il toggle non devono lanciare eccezioni; la pagina deve comunque avere un tema. → test in Task 3 (`readStoredTheme` e `toggle()` con storage che lancia).
2. **Browser italiano con codice regionale** (`it-IT`, `it-CH`): `/` deve portare a `/it/`, non a `/en/`. → verifica `curl` in Task 8.
3. **Vecchi URL già indicizzati** del sito Gatsby (`/privacy`, `/imprint`, `/blog`, `/my-first-article`): devono dare un 301, non un 404. → regole in Task 6, verifica `curl` in Task 8.
4. **Cambio lingua da un URL con frammento o query** (`/en/#work`, `/en/work/apexflow?ref=linkedin`): l'utente deve arrivare allo stesso punto nell'altra lingua. → test in Task 4.
5. **Slug sbagliato o URL inesistente** (`/en/work/apexflw`): deve comparire una pagina 404 localizzata con un link alla home, non una pagina bianca. → Task 5 (pagina e test), Task 6 (regola Netlify), Task 8 (verifica `curl`).

---

## Sistema visivo (risultato della skill `frontend-design`)

Questa sezione è la base del Task 2. Va letta prima di scrivere qualunque CSS.

**Colore** (dalla spec, con un nome per ciascuno):

| Nome | Light | Dark | Ruolo |
|---|---|---|---|
| Concrete | `#e5e5e5` | Night `#121212` | fondo pagina |
| Paper | `#f2f2f2` | Slate `#1c1c1c` | superfici (blocchi, codice) |
| Ink | `#1d1d1c` | `rgba(255,255,255,.87)` | testo |
| Graphite | `#555555` | `#aaaaaa` | testo secondario |
| Signal Blue | `#0066d4` | `#0066d4` | bottoni, pixel, focus |
| Link Blue | `#005fc5` | `#4d9bf0` | testo d'accento e link |

Pastelli (solo pixel e illustrazioni): Lavender, Mint, Peach + tinte di blu, valori nel Task 2.

**Tipografia:** una sola famiglia, **Instrument Sans Variable** (assi `wght` 400–700 e `wdth` 75–100). Il titolo dell'hero usa la larghezza condensata (`wdth` 75, peso 600) come elemento grafico: è la versione tipografica del "maiuscolo stretto" del riferimento wild, ma in sentence case. Testo a 18 px, interlinea 1.55, misura massima 68 caratteri. Scala modulare 1.25 (terza maggiore): 14.4 · 18 · 22.5 · 28.1 · 35.2 · 44 · 55 px, più l'hero fluido fino a 96 px.

**Layout:** tutto si aggancia a una **griglia di pixel da 8 px**: spaziature, dimensioni delle icone e, nel Piano 3, la cella del pixel field. Colonna di contenuto allineata a sinistra, larghezza massima 1200 px, gutter 16 px su mobile e 32 px da 768 px in su.

```
HERO (desktop)                                  HERO (mobile)
┌────────────────────────────────────────┐     ┌──────────────────┐
│ edm.            Work About Contact IT ☾│     │ edm.        IT ☾ │
│                                        │     │                  │
│ I build Angular interfaces             │     │ I build Angular  │
│ that stay fast when the                │     │ interfaces that  │
│ data gets big.                         │     │ stay fast when   │
│                                        │     │ the data gets    │
│ Frontend Engineer at IPS, Latina       │     │ big.             │
│ [See my work]  Contact me              │     │ [See my work]    │
│░░▓░░░▒░░▓▓░░░░▒░░░▓░░░░▒▒░░▓░░░░▒░░▓░░░│     │░▓░░▒░░▓▓░░▒░░▓░░│
│░▒░░▓░░░░▒░░▓░░░░▒▒░░░▓░░░▒░░░░▓░░▒░░▓░░│     │▒░░▓░░▒░░░▓░░▒░░░│
└────────────────────────────────────────┘     └──────────────────┘
  testo a sinistra, pixel field (Piano 3) a tutta larghezza in basso
```

**Principi:**
1. Tutto si aggancia alla griglia di pixel da 8 px.
2. L'audacia sta in un solo posto: il pixel field dell'hero e il moai. Il resto è testo tranquillo su griglia.
3. Angoli vivi e niente ombre sfumate. L'unica profondità è un'"ombra pixel" piena di 4 px sul bottone principale al passaggio del mouse.
4. Niente etichette sopra i titoli, niente stringhe di metadati in monospace, niente "→" aggiunto ai link. Le sezioni si aprono con un titolo semplice in sentence case.
5. Movimento: un solo momento orchestrato (l'assemblaggio dei pixel, Piano 3). Altrove il movimento risponde all'utente.

**Revisione rispetto al "default generato" (cosa ho cambiato e perché):**
- **Tolte le etichette monospace in maiuscolo** ("ANGULAR · SIGNALS · RXJS", "FIG. 01") presenti nella §4.2 della spec e nei mockup: sono il segno più riconoscibile di un sito fatto con template. Lo stack si dice con una frase.
- **Cambiato il titolo dell'hero** da "Frontend, engineered." (calco di "Craft, engineered." di wild) a una frase che viene dal lavoro reale di Emanuele: il post LinkedIn sui 10.000 record.
- **Titolo condensato in sentence case invece che in maiuscolo:** una frase lunga in maiuscolo urla. La larghezza ridotta porta comunque il carattere "ingegneristico" del riferimento.
- **Nessun numero di sezione (01/02/03):** le sezioni non sono una sequenza. Fa eccezione la timeline dell'esperienza (Piano 2), che lo è davvero.

---

### Task 0: Scansione dei segreti nelle repo da rendere pubbliche

Nessun codice nel repo. Il risultato è un report per Emanuele, che poi rende pubbliche le repo.

**Files:**
- Create (fuori dal repo): `$SCRATCH/secret-scan/`, con `SCRATCH=$(mktemp -d)`

**Interfaces:**
- Consumes: niente.
- Produces: un report in chat per ogni repo con "pulita" oppure l'elenco dei segreti trovati (file, commit, tipo), senza riportare il valore del segreto.

- [ ] **Step 1: Installa gitleaks**

Run: `brew install gitleaks && gitleaks version`
Expected: stampa una versione (es. `8.x`).

- [ ] **Step 2: Clona le repo in una directory temporanea**

```bash
SCRATCH=$(mktemp -d) && mkdir -p "$SCRATCH/secret-scan" && cd "$SCRATCH/secret-scan"
for r in dashboard-tesi ice-friends-breaker auto-scadenze-bot hoenn-binder presenz-lazy-bot pokeverba-site magsafe-cardholder volkswagen-up-door-storage-box; do
  gh repo clone "xdelmo/$r" "$r" -- --quiet
done
```

- [ ] **Step 3: Scansiona tutta la storia git di ogni repo**

```bash
for r in */; do
  r=${r%/}
  gitleaks git "$r" --redact --report-format json --report-path "$r.json" --no-banner >/dev/null 2>&1
  echo "$r: $(jq length "$r.json") findings"
done
```

Expected: una riga per repo con il numero di risultati.

- [ ] **Step 4: Controlla anche i file `.env` e simili ancora presenti nel branch principale**

```bash
for r in */; do echo "== $r"; git -C "$r" ls-files | grep -E -i '(^|/)\.env|secret|credential|\.pem$|\.key$|serviceAccount' || echo "nessuno"; done
```

- [ ] **Step 5: Riporta i risultati a Emanuele**

Per ogni repo con risultati: file, commit, tipo di segreto (da `RuleID` nel JSON). Il valore è già oscurato da `--redact`. Raccomandazione standard: **rigenerare** la chiave o il token presso il servizio (BotFather, Supabase, database…), perché riscrivere la storia non basta se la chiave è già uscita. Per le repo senza risultati: "pulita, si può rendere pubblica". Non rendere pubblica nessuna repo: è una decisione di Emanuele.

- [ ] **Step 6: Elimina i cloni**

Run: `rm -rf "$SCRATCH/secret-scan"`

---

### Task 1: Scaffolding Angular al posto di Gatsby

**Files:**
- Delete: `gatsby-config.js`, `package.json`, `src/`, `content/`, `static/`, `.cache/`, `public/` (Gatsby)
- Create: progetto Angular nella root (generato), `.nvmrc`, `netlify.toml`
- Modify: `.gitignore`, `angular.json`, `CLAUDE.md`

**Interfaces:**
- Consumes: niente.
- Produces: progetto `portfolio`; output di build in `dist/portfolio/browser/`; script npm `start`, `build`, `test`. Componente radice `App` in `src/app/app.ts`; `src/app/app.config.ts`, `src/app/app.routes.ts`, `src/app/app.routes.server.ts`, `src/app/app.config.server.ts`.

- [ ] **Step 1: Passa a Node 24**

```bash
echo 24 > .nvmrc
nvm install 24 && nvm use 24   # oppure: brew install node@24
node -v
```

Expected: `v24.x` (≥ 24.15).

- [ ] **Step 2: Rimuovi il sito Gatsby dal branch `v2`**

Il sito resta intatto su `master`: le immagini dei progetti si recuperano nel Piano 2 con `git show master:content/images/<file>`.

```bash
git rm -r -q gatsby-config.js package.json src content static
rm -rf .cache public node_modules package-lock.json
```

- [ ] **Step 3: Controlla le opzioni di `ng new` della versione attuale**

Run: `npx @angular/cli@latest new --help`
Annota i nomi esatti di: `--ssr`, `--style`, `--zoneless`, `--test-runner`, `--ai-config`, `--skip-git`, `--directory`.

- [ ] **Step 4: Genera il progetto in una directory temporanea e copialo nella root**

`ng new` non scrive in una directory che contiene già file (README, LICENSE, docs…), quindi si genera altrove e si copia.

```bash
SCRATCH=$(mktemp -d)
npx @angular/cli@latest new portfolio \
  --directory "$SCRATCH/ng-portfolio" \
  --ssr --style=css --routing --zoneless --test-runner=vitest \
  --ai-config=none --skip-git --package-manager=npm --defaults
rsync -a --exclude README.md --exclude .gitignore "$SCRATCH/ng-portfolio/" ./
cat "$SCRATCH/ng-portfolio/.gitignore" > .gitignore
printf '\n# brainstorming companion\n.superpowers\n# lighthouse\n.lighthouseci\n# playwright\ntest-results\nplaywright-report\n' >> .gitignore
rm -rf "$SCRATCH/ng-portfolio"
npm install
```

Se un'opzione dello Step 3 ha un nome diverso, usa il nome reale; se `--zoneless` o `--test-runner` non esistono più perché sono il default, omettile.

- [ ] **Step 5: Configura l'output statico**

In `angular.json`, dentro `projects.portfolio.architect.build.options`:
- imposta `"outputMode": "static"`;
- rimuovi la chiave `"ssr"` (l'entry `src/server.ts` serve solo al server Node, che non usiamo);
- imposta `"outputPath": "dist/portfolio"`.

Poi elimina il server Express: `git rm -q --cached src/server.ts 2>/dev/null; rm -f src/server.ts`.

`src/app/app.routes.server.ts` deve contenere:

```ts
import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: '**', renderMode: RenderMode.Prerender },
];
```

- [ ] **Step 6: Verifica che la build produca HTML statico**

Run: `npx ng build && ls dist/portfolio/browser && grep -c '<app-root' dist/portfolio/browser/index.html`
Expected: build verde, `index.html` presente, il conteggio è `1`, nessun file `server.mjs` usato per servire. Se la build rifiuta l'assenza di `ssr.entry`, ripristina `src/server.ts` e la chiave `ssr`, lascia `outputMode: "static"` e annota la scelta nel commit.

- [ ] **Step 7: Verifica che i test unitari girino**

Run: `npx ng test --no-watch`
Expected: PASS del test generato da `ng new` (`app.spec.ts`).

- [ ] **Step 8: Crea `netlify.toml`**

```toml
[build]
  command = "npm run build"
  publish = "dist/portfolio/browser"

[build.environment]
  NODE_VERSION = "24"
```

Le regole di redirect si aggiungono nei Task 4 e 6.

- [ ] **Step 9: Aggiorna `CLAUDE.md`**

Sostituisci le sezioni "Commands" e "Architecture" con:

```markdown
## Commands

- `nvm use` — Node 24 (from `.nvmrc`; Angular 22 needs ≥ 24.15)
- `npm start` — dev server (English build) at http://localhost:4200
- `npm run start:it` — dev server, Italian build
- `npm run build` — static prerender of both locales into `dist/portfolio/browser/{en,it}` + sitemap/robots
- `npx ng test --no-watch` — unit tests (Vitest); one file: `npx ng test --no-watch --include src/app/core/theme/theme.spec.ts`
- `npm run e2e` — Playwright against the built site (run `npm run build` first); one test: `npx playwright test e2e/theme.spec.ts --project=chromium`
- `npm run lhci` — Lighthouse CI against the built site
- `npm run i18n:extract` — regenerate `src/locale/messages.xlf` after changing template strings, then update `messages.it.xlf`
- `node --test scripts/` — tests for the build scripts

## Architecture

Angular 22 (standalone, zoneless, signals), fully prerendered (`outputMode: "static"`), deployed on Netlify. Spec: `docs/superpowers/specs/2026-10-03-portfolio-v2-design.md`; plans in `docs/superpowers/plans/`.

- Two locale builds via `@angular/localize`: English is the template source language, Italian lives in `src/locale/messages.it.xlf` (missing translations fail the build). UI strings use explicit `@@ids`; long content comes from `src/app/content/content.{en,it}.ts`, picked by `LOCALE_ID` through the `CONTENT` token.
- Logic that can break lives in pure, unit-tested functions next to thin services: `core/theme/theme.ts`, `core/i18n/locale.ts`, `core/seo/seo.ts`.
- Theme: an inline script in `src/index.html` sets `data-theme` before first paint; `ThemeService` takes over after hydration. All colors are CSS variables in `src/styles/tokens.css`.
- Netlify (`netlify.toml`) does the language redirect on `/` (honouring the `nf_lang` cookie set by the language switch), the canonical-domain 301s, legacy Gatsby URLs and per-locale 404s.
- `scripts/postbuild.mjs` builds `sitemap.xml` and `robots.txt` at the publish root from the prerendered pages' canonical/hreflang tags.
```

Rimuovi la sezione "Conventions" sulle immagini di Screely e sul flag `visible` (non valgono più); lascia "Site content and UI copy are in Italian" sostituendolo con "Site content is bilingual (English source, Italian translation)."

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "chore: replace Gatsby with Angular 22 static scaffold

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Token visivi, font e stili di base

**Files:**
- Create: `src/styles/tokens.css`, `src/styles/base.css`
- Modify: `src/styles.css`, `package.json` (dipendenza font)
- Test: verificato visivamente + dal test axe del Task 7

**Interfaces:**
- Consumes: Task 1.
- Produces: variabili CSS `--bg --surface --fg --fg-muted --accent --link --focus --px-1…--px-6`, `--space-1…--space-16` (multipli di 8 px), `--step--1 --step-0 … --step-5 --step-hero`, `--measure`, `--container`, `--gutter`; classi globali `.container`, `.visually-hidden`, `.skip-link`, `.button`, `.button--primary`.

- [ ] **Step 1: Installa il font**

Run: `npm install @fontsource-variable/instrument-sans@5.3.0`

- [ ] **Step 2: Scrivi `src/styles/tokens.css`**

```css
:root,
:root[data-theme='light'] {
  color-scheme: light;
  --bg: #e5e5e5;
  --surface: #f2f2f2;
  --fg: #1d1d1c;
  --fg-muted: #555555;
  --accent: #0066d4;
  --on-accent: #ffffff;
  --link: #005fc5;
  --focus: #0066d4;
  --rule: rgb(29 29 28 / 0.14);
  /* pixel palette: decorative only, never for text */
  --px-1: #0066d4;
  --px-2: #7fb2ec;
  --px-3: #b9d5f5;
  --px-4: #c9b8f5;
  --px-5: #a8e0c8;
  --px-6: #ffc9a8;
}

:root[data-theme='dark'] {
  color-scheme: dark;
  --bg: #121212;
  --surface: #1c1c1c;
  --fg: rgb(255 255 255 / 0.87);
  --fg-muted: #aaaaaa;
  --accent: #0066d4;
  --on-accent: #ffffff;
  --link: #4d9bf0;
  --focus: #4d9bf0;
  --rule: rgb(255 255 255 / 0.12);
  --px-1: #0066d4;
  --px-2: #2f86ea;
  --px-3: #6aa9f2;
  --px-4: #9d8cf0;
  --px-5: #7ccfa8;
  --px-6: #f0a982;
}

:root {
  /* 8px pixel grid */
  --space-1: 8px;
  --space-2: 16px;
  --space-3: 24px;
  --space-4: 32px;
  --space-6: 48px;
  --space-8: 64px;
  --space-12: 96px;
  --space-16: 128px;

  /* modular scale 1.25 on 18px */
  --step--1: 0.8rem;     /* 14.4px */
  --step-0: 1.125rem;    /* 18px   */
  --step-1: 1.406rem;    /* 22.5px */
  --step-2: 1.758rem;    /* 28.1px */
  --step-3: 2.197rem;    /* 35.2px */
  --step-4: 2.747rem;    /* 44px   */
  --step-5: 3.433rem;    /* 55px   */
  --step-hero: clamp(2.747rem, 1.6rem + 5.2vw, 6rem); /* 44px → 96px */

  --font-sans: 'Instrument Sans Variable', ui-sans-serif, system-ui, sans-serif;
  --measure: 68ch;
  --container: 1200px;
  --gutter: 16px;
}

@media (min-width: 768px) {
  :root {
    --gutter: 32px;
  }
}
```

- [ ] **Step 3: Scrivi `src/styles/base.css`**

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
}

body {
  margin: 0;
  min-height: 100svh;
  background: var(--bg);
  color: var(--fg);
  font-family: var(--font-sans);
  font-size: var(--step-0);
  line-height: 1.55;
  font-variation-settings: 'wdth' 100;
  overflow-x: clip;
}

h1,
h2,
h3 {
  margin: 0;
  font-weight: 600;
  line-height: 1.1;
  font-variation-settings: 'wdth' 85;
  text-wrap: balance;
}

h1 {
  font-size: var(--step-hero);
  line-height: 1.02;
  font-variation-settings: 'wdth' 75;
  letter-spacing: -0.01em;
}

h2 {
  font-size: var(--step-4);
}

h3 {
  font-size: var(--step-2);
}

p {
  margin: 0;
  max-width: var(--measure);
  text-wrap: pretty;
}

a {
  color: var(--link);
  text-underline-offset: 0.2em;
}

:focus-visible {
  outline: 3px solid var(--focus);
  outline-offset: 3px;
}

img,
svg,
canvas {
  display: block;
  max-width: 100%;
}

.container {
  width: 100%;
  max-width: calc(var(--container) + 2 * var(--gutter));
  margin-inline: auto;
  padding-inline: var(--gutter);
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}

.skip-link {
  position: absolute;
  left: var(--space-2);
  top: -100px;
  z-index: 10;
  padding: var(--space-1) var(--space-2);
  background: var(--fg);
  color: var(--bg);
}

.skip-link:focus {
  top: var(--space-2);
}

.button {
  display: inline-flex;
  align-items: center;
  min-height: 48px;
  padding: 0 var(--space-3);
  border: 2px solid var(--fg);
  color: var(--fg);
  font: inherit;
  font-weight: 600;
  text-decoration: none;
  background: transparent;
  cursor: pointer;
}

.button--primary {
  border-color: var(--accent);
  background: var(--accent);
  color: var(--on-accent);
}

@media (hover: hover) and (prefers-reduced-motion: no-preference) {
  .button {
    transition: transform 120ms steps(2), box-shadow 120ms steps(2);
  }
  .button--primary:hover {
    transform: translate(-4px, -4px);
    box-shadow: 4px 4px 0 var(--fg);
  }
}
```

- [ ] **Step 4: Collega i file in `src/styles.css`**

Sostituisci il contenuto con:

```css
@import '@fontsource-variable/instrument-sans/wdth.css';
@import './styles/tokens.css';
@import './styles/base.css';
```

- [ ] **Step 5: Verifica che il font contenga l'asse `wdth`**

Run: `npx ng build && grep -o "font-stretch:[^;]*" dist/portfolio/browser/styles-*.css | head -1`
Expected: build verde e una riga `font-stretch:75% 100%` (o simile). Se manca, il file importato non è quello con l'asse di larghezza: elenca con `ls node_modules/@fontsource-variable/instrument-sans/` e scegli il CSS che contiene `wdth`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add design tokens, Instrument Sans and base styles

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Tema light/dark

**Files:**
- Create: `src/app/core/theme/theme.ts`, `src/app/core/theme/theme.service.ts`, `src/app/core/theme/theme-toggle.ts`
- Modify: `src/index.html`
- Test: `src/app/core/theme/theme.spec.ts`, `src/app/core/theme/theme.service.spec.ts`

**Interfaces:**
- Consumes: variabili CSS del Task 2 (`data-theme` su `<html>`).
- Produces:
  - `type Theme = 'light' | 'dark'`
  - `const THEME_STORAGE_KEY = 'theme'`
  - `resolveTheme(stored: string | null, prefersDark: boolean): Theme`
  - `readStoredTheme(storage: Pick<Storage, 'getItem'> | undefined): string | null`
  - `ThemeService` (root): `theme: Signal<Theme>` (readonly), `toggle(): void`
  - componente `<app-theme-toggle />` (`ThemeToggle`)

- [ ] **Step 1: Scrivi i test delle funzioni pure**

`src/app/core/theme/theme.spec.ts`:

```ts
import { readStoredTheme, resolveTheme } from './theme';

describe('resolveTheme', () => {
  it('uses a valid stored choice over the system preference', () => {
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });

  it('falls back to the system preference when nothing valid is stored', () => {
    expect(resolveTheme(null, true)).toBe('dark');
    expect(resolveTheme(null, false)).toBe('light');
    expect(resolveTheme('purple', true)).toBe('dark');
  });
});

describe('readStoredTheme', () => {
  it('reads the stored value', () => {
    expect(readStoredTheme({ getItem: () => 'dark' })).toBe('dark');
  });

  it('returns null when storage is missing', () => {
    expect(readStoredTheme(undefined)).toBeNull();
  });

  it('returns null instead of throwing when storage is blocked', () => {
    const blocked = {
      getItem: () => {
        throw new DOMException('denied', 'SecurityError');
      },
    };
    expect(readStoredTheme(blocked)).toBeNull();
  });
});
```

- [ ] **Step 2: Verifica che falliscano**

Run: `npx ng test --no-watch --include src/app/core/theme/theme.spec.ts`
Expected: FAIL, `Cannot find module './theme'`.

- [ ] **Step 3: Implementa `src/app/core/theme/theme.ts`**

```ts
export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'theme';

export function resolveTheme(stored: string | null, prefersDark: boolean): Theme {
  if (stored === 'light' || stored === 'dark') return stored;
  return prefersDark ? 'dark' : 'light';
}

export function readStoredTheme(storage: Pick<Storage, 'getItem'> | undefined): string | null {
  try {
    return storage?.getItem(THEME_STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Verifica che passino**

Run: `npx ng test --no-watch --include src/app/core/theme/theme.spec.ts`
Expected: PASS (5 test).

- [ ] **Step 5: Scrivi i test del servizio**

`src/app/core/theme/theme.service.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset['theme'];
  });

  afterEach(() => vi.restoreAllMocks());

  it('starts from the stored choice', () => {
    localStorage.setItem('theme', 'dark');
    const service = TestBed.inject(ThemeService);
    expect(service.theme()).toBe('dark');
  });

  it('toggle flips the theme, updates <html> and stores the choice', () => {
    const service = TestBed.inject(ThemeService);
    const before = service.theme();
    service.toggle();
    const after = before === 'dark' ? 'light' : 'dark';
    expect(service.theme()).toBe(after);
    expect(document.documentElement.dataset['theme']).toBe(after);
    expect(localStorage.getItem('theme')).toBe(after);
  });

  it('toggle still works when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('denied', 'QuotaExceededError');
    });
    const service = TestBed.inject(ThemeService);
    const before = service.theme();
    expect(() => service.toggle()).not.toThrow();
    expect(service.theme()).not.toBe(before);
  });
});
```

- [ ] **Step 6: Verifica che falliscano**

Run: `npx ng test --no-watch --include src/app/core/theme/theme.service.spec.ts`
Expected: FAIL, `Cannot find module './theme.service'`.

- [ ] **Step 7: Implementa `src/app/core/theme/theme.service.ts`**

```ts
import { DOCUMENT, Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { THEME_STORAGE_KEY, Theme, readStoredTheme, resolveTheme } from './theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT);
  private readonly win = isPlatformBrowser(inject(PLATFORM_ID)) ? this.doc.defaultView : null;
  private readonly current = signal<Theme>('light');
  private explicitChoice = false;

  readonly theme = this.current.asReadonly();

  constructor() {
    if (!this.win) return;
    const stored = readStoredTheme(this.storage());
    this.explicitChoice = stored === 'light' || stored === 'dark';
    const query = this.win.matchMedia?.('(prefers-color-scheme: dark)');
    this.apply(resolveTheme(stored, query?.matches ?? false));
    query?.addEventListener('change', (event) => {
      if (!this.explicitChoice) this.apply(event.matches ? 'dark' : 'light');
    });
  }

  toggle(): void {
    const next: Theme = this.current() === 'dark' ? 'light' : 'dark';
    this.explicitChoice = true;
    try {
      this.storage()?.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // storage blocked: the choice lasts until the page is closed
    }
    this.apply(next);
  }

  private apply(theme: Theme): void {
    this.current.set(theme);
    this.doc.documentElement.dataset['theme'] = theme;
  }

  private storage(): Storage | undefined {
    try {
      return this.win?.localStorage;
    } catch {
      return undefined;
    }
  }
}
```

Se `DOCUMENT` non è esportato da `@angular/core` in questa versione, importalo da `@angular/common`.

- [ ] **Step 8: Verifica che passino**

Run: `npx ng test --no-watch --include src/app/core/theme/theme.service.spec.ts`
Expected: PASS (3 test).

- [ ] **Step 9: Script anti-flash in `src/index.html`**

Inserisci nell'`<head>`, prima di qualunque foglio di stile:

```html
<script>
  (function () {
    var t = null;
    try { t = localStorage.getItem('theme'); } catch (e) {}
    if (t !== 'light' && t !== 'dark') {
      t = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', t);
  })();
</script>
```

- [ ] **Step 10: Implementa il toggle `src/app/core/theme/theme-toggle.ts`**

Icone pixel 8×8 disegnate con rettangoli, `shape-rendering="crispEdges"`.

```ts
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ThemeService } from './theme.service';

@Component({
  selector: 'app-theme-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" class="theme-toggle" (click)="themes.toggle()" [attr.aria-label]="label()">
      <svg viewBox="0 0 8 8" width="24" height="24" shape-rendering="crispEdges" aria-hidden="true">
        @if (themes.theme() === 'dark') {
          <path fill="currentColor" d="M3 0h2v1H3zM3 7h2v1H3zM0 3h1v2H0zM7 3h1v2H7zM1 1h1v1H1zM6 1h1v1H6zM1 6h1v1H1zM6 6h1v1H6zM2 2h4v4H2z" />
        } @else {
          <path fill="currentColor" d="M3 0h3v1H3zM2 1h2v1H2zM1 2h2v4H1zM2 6h2v1H2zM3 7h3v1H3zM6 6h1v1H6zM3 5h4v1H3z" />
        }
      </svg>
    </button>
  `,
  styles: `
    .theme-toggle {
      display: grid;
      place-items: center;
      width: 48px;
      height: 48px;
      padding: 0;
      border: 0;
      background: transparent;
      color: var(--fg);
      cursor: pointer;
    }
  `,
})
export class ThemeToggle {
  protected readonly themes = inject(ThemeService);
  protected readonly label = computed(() =>
    this.themes.theme() === 'dark'
      ? $localize`:@@theme.toLight:Switch to light theme`
      : $localize`:@@theme.toDark:Switch to dark theme`,
  );
}
```

`$localize` diventa disponibile con il Task 4: se questo task viene eseguito prima, esegui ora lo Step 1 del Task 4 (`ng add @angular/localize`).

- [ ] **Step 11: Build e test completi**

Run: `npx ng test --no-watch && npx ng build`
Expected: tutti i test PASS, build verde.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat: add light/dark theme with no-flash startup and toggle

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Lingue IT/EN

**Files:**
- Create: `src/app/core/i18n/locale.ts`, `src/app/core/i18n/language-switch.ts`, `src/locale/messages.it.xlf` (prima versione)
- Modify: `angular.json`, `package.json` (script), `netlify.toml`
- Test: `src/app/core/i18n/locale.spec.ts`

**Interfaces:**
- Consumes: Task 1.
- Produces:
  - `type Locale = 'en' | 'it'`
  - `toLocale(localeId: string): Locale`
  - `localizedUrl(routerUrl: string, target: Locale): string`
  - componente `<app-language-switch />` (`LanguageSwitch`)
  - build in `dist/portfolio/browser/en/` e `dist/portfolio/browser/it/`, ciascuna con `<html lang>` e `<base href>` corretti

- [ ] **Step 1: Aggiungi `@angular/localize`**

Run: `npx ng add @angular/localize --skip-confirmation`

- [ ] **Step 2: Configura le lingue in `angular.json`**

Dentro `projects.portfolio`:

```json
"i18n": {
  "sourceLocale": { "code": "en", "subPath": "en" },
  "locales": {
    "it": { "translation": "src/locale/messages.it.xlf", "subPath": "it" }
  }
}
```

Dentro `architect.build.options`: `"localize": true` e `"i18nMissingTranslation": "error"`.

Dentro `architect.build.configurations` aggiungi:

```json
"development-it": {
  "optimization": false,
  "extractLicenses": false,
  "sourceMap": true,
  "localize": ["it"]
}
```

e alla configurazione `development` aggiungi `"localize": ["en"]`.

Dentro `architect.serve.configurations` aggiungi `"development-it": { "buildTarget": "portfolio:build:development-it" }`.

In `package.json`, script:

```json
"start": "ng serve",
"start:it": "ng serve --configuration development-it",
"i18n:extract": "ng extract-i18n --output-path src/locale"
```

- [ ] **Step 3: Scrivi i test di `locale.ts`**

`src/app/core/i18n/locale.spec.ts`:

```ts
import { localizedUrl, toLocale } from './locale';

describe('toLocale', () => {
  it('maps Italian locale ids to it', () => {
    expect(toLocale('it')).toBe('it');
    expect(toLocale('it-IT')).toBe('it');
  });

  it('maps everything else to en', () => {
    expect(toLocale('en')).toBe('en');
    expect(toLocale('en-US')).toBe('en');
    expect(toLocale('de')).toBe('en');
  });
});

describe('localizedUrl', () => {
  it('maps the home page', () => {
    expect(localizedUrl('/', 'it')).toBe('/it/');
  });

  it('maps a nested page', () => {
    expect(localizedUrl('/work/apexflow', 'en')).toBe('/en/work/apexflow');
  });

  it('keeps fragments and query strings', () => {
    expect(localizedUrl('/#work', 'it')).toBe('/it/#work');
    expect(localizedUrl('/work/apexflow?ref=linkedin', 'it')).toBe('/it/work/apexflow?ref=linkedin');
  });

  it('accepts a url without the leading slash', () => {
    expect(localizedUrl('work/apexflow', 'it')).toBe('/it/work/apexflow');
  });
});
```

- [ ] **Step 4: Verifica che falliscano**

Run: `npx ng test --no-watch --include src/app/core/i18n/locale.spec.ts`
Expected: FAIL, `Cannot find module './locale'`.

- [ ] **Step 5: Implementa `src/app/core/i18n/locale.ts`**

```ts
export type Locale = 'en' | 'it';

export function toLocale(localeId: string): Locale {
  return localeId.toLowerCase().startsWith('it') ? 'it' : 'en';
}

/** Same page in the other locale build. `routerUrl` is Router.url (no locale prefix). */
export function localizedUrl(routerUrl: string, target: Locale): string {
  const path = routerUrl.startsWith('/') ? routerUrl : `/${routerUrl}`;
  return `/${target}${path}`;
}
```

- [ ] **Step 6: Verifica che passino**

Run: `npx ng test --no-watch --include src/app/core/i18n/locale.spec.ts`
Expected: PASS (6 test).

- [ ] **Step 7: Implementa `src/app/core/i18n/language-switch.ts`**

È un link vero (`<a href>`): le due lingue sono build separate, quindi il cambio è una navigazione completa e funziona anche senza JavaScript. Il cookie `nf_lang` fa ricordare la scelta a Netlify.

```ts
import { ChangeDetectionStrategy, Component, DOCUMENT, LOCALE_ID, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';
import { Locale, localizedUrl, toLocale } from './locale';

@Component({
  selector: 'app-language-switch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="language-switch" [href]="href()" [attr.hreflang]="target" [attr.lang]="target" (click)="remember()">
      {{ targetName }}
    </a>
  `,
  styles: `
    .language-switch {
      display: inline-grid;
      place-items: center;
      min-width: 48px;
      min-height: 48px;
      color: var(--fg);
      font-weight: 600;
    }
  `,
})
export class LanguageSwitch {
  private readonly router = inject(Router);
  private readonly doc = inject(DOCUMENT);

  protected readonly target: Locale = toLocale(inject(LOCALE_ID)) === 'it' ? 'en' : 'it';
  protected readonly targetName = this.target === 'it' ? 'Italiano' : 'English';

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  protected readonly href = computed(() => localizedUrl(this.url(), this.target));

  protected remember(): void {
    this.doc.cookie = `nf_lang=${this.target}; path=/; max-age=31536000; samesite=lax`;
  }
}
```

- [ ] **Step 8: Redirect di lingua in `netlify.toml`**

Aggiungi in fondo:

```toml
# Language redirect, only for the bare root. Netlify lets the nf_lang cookie
# (set by the language switch) override the browser's Accept-Language.
[[redirects]]
  from = "/"
  to = "/it/"
  status = 302
  conditions = { Language = ["it"] }

[[redirects]]
  from = "/"
  to = "/en/"
  status = 302
```

- [ ] **Step 9: Prima traduzione, build e commit**

Le uniche stringhe di UI finora sono quelle del toggle del tema. Estraile e crea il file italiano (il Task 5 lo rigenera con tutte le stringhe):

Run: `npm run i18n:extract`
Expected: `src/locale/messages.xlf` con `@@theme.toLight` e `@@theme.toDark`.

Copia il file in `src/locale/messages.it.xlf`, aggiungi `target-language="it"` all'elemento `<file>` e un `<target>` dopo ogni `<source>`: `Passa al tema chiaro`, `Passa al tema scuro`. Aggiungi `src/locale/messages.xlf` al `.gitignore`.

Run: `npx ng test --no-watch && npx ng build && grep -o '<html lang="[a-z]*"' dist/portfolio/browser/it/index.html`
Expected: test PASS, build verde, `<html lang="it"`.

```bash
git add -A
git commit -m "feat: add en/it locales, url mapping and language switch

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Contenuti tipizzati, layout e pagine

**Files:**
- Create: `src/app/content/content.model.ts`, `src/app/content/content.en.ts`, `src/app/content/content.it.ts`, `src/app/content/content.ts`, `src/app/layout/site-header.ts`, `src/app/layout/site-footer.ts`, `src/app/pages/home/home.ts`, `src/app/pages/case-study/case-study.ts`, `src/app/pages/not-found/not-found.ts`
- Modify: `src/app/app.ts`, `src/app/app.html`, `src/app/app.css`, `src/app/app.routes.ts`, `src/app/app.routes.server.ts`, `src/app/app.config.ts`, `src/app/app.spec.ts`, `src/locale/messages.it.xlf`
- Test: `src/app/content/content.spec.ts`, `src/app/pages/case-study/case-study.spec.ts`

**Interfaces:**
- Consumes: `ThemeToggle` (Task 3), `LanguageSwitch`, `toLocale`, `Locale` (Task 4), classi CSS del Task 2.
- Produces:
  - `interface Project { slug: string; title: string; summary: string; stack: readonly string[]; repoUrls: readonly string[]; demoUrl?: string }`
  - `interface SiteContent { person: Person; hero: { headline: string; lede: string }; about: string; projects: readonly Project[] }`
  - `interface Person { name: string; role: string; employer: string; location: string; availability: string; email: string; linkedin: string; github: string; knowsAbout: readonly string[] }`
  - `CONTENT: InjectionToken<SiteContent>`; `CONTENT_EN`, `CONTENT_IT`
  - route: `''` → `Home`, `'work/:slug'` → `CaseStudy` (input `slug`), `'404'` → `NotFound`, `'**'` → redirect a `'404'`
  - id delle sezioni della home: `#work`, `#about`, `#contact`

- [ ] **Step 1: Modello dei contenuti `src/app/content/content.model.ts`**

```ts
export interface Person {
  name: string;
  role: string;
  employer: string;
  location: string;
  availability: string;
  email: string;
  linkedin: string;
  github: string;
  knowsAbout: readonly string[];
}

export interface Project {
  slug: string;
  title: string;
  summary: string;
  stack: readonly string[];
  repoUrls: readonly string[];
  demoUrl?: string;
}

export interface SiteContent {
  person: Person;
  hero: { headline: string; lede: string };
  about: string;
  projects: readonly Project[];
}
```

- [ ] **Step 2: Contenuti inglesi `src/app/content/content.en.ts`**

Testi provvisori ma veri: li rifinisce il Piano 2.

```ts
import { SiteContent } from './content.model';

export const CONTENT_EN: SiteContent = {
  person: {
    name: 'Emanuele Del Monte',
    role: 'Frontend Engineer',
    employer: 'IPS S.p.A.',
    location: 'Latina, Italy',
    availability: 'Open to remote and on-site roles from March 2027.',
    email: 'info@emanueledelmonte.it',
    linkedin: 'https://www.linkedin.com/in/emanueledelmonte/',
    github: 'https://github.com/xdelmo',
    knowsAbout: ['Angular', 'Angular Signals', 'RxJS', 'TypeScript', 'PrimeNG', 'Spring Boot'],
  },
  hero: {
    headline: 'I build Angular interfaces that stay fast when the data gets big.',
    lede: 'Frontend Engineer at IPS S.p.A., based in Latina, Italy. Computer Engineering graduate, 2026.',
  },
  about:
    'I work on enterprise front ends: large tables, server-side filtering, state that has to stay predictable. My thesis, ApexFlow, is a full-stack CRM dashboard built with Angular Signals and Spring Boot.',
  projects: [
    {
      slug: 'apexflow',
      title: 'ApexFlow',
      summary: 'A CRM and analytics dashboard: Angular 19 with Signals and RxJS on the front end, Spring Boot 3 and PostgreSQL on the back end.',
      stack: ['Angular', 'Signals', 'RxJS', 'PrimeNG', 'Spring Boot', 'PostgreSQL'],
      repoUrls: ['https://github.com/xdelmo/dashboard-tesi', 'https://github.com/xdelmo/backend-tesi'],
      demoUrl: 'https://dashboard-tesi.vercel.app/welcome',
    },
    {
      slug: 'ice-friends-breaker',
      title: 'Ice Friends Breaker',
      summary: 'A social card game to break the ice, installable on phones as a PWA and native app.',
      stack: ['Next.js', 'Supabase', 'Tailwind CSS', 'Capacitor'],
      repoUrls: ['https://github.com/xdelmo/ice-friends-breaker'],
      demoUrl: 'https://ice-friends-breaker.vercel.app',
    },
    {
      slug: 'mcp-server',
      title: 'MCP Server',
      summary: 'A Model Context Protocol server and client that lets an LLM read and edit documents through custom tools.',
      stack: ['Python', 'MCP'],
      repoUrls: ['https://github.com/xdelmo/mcp-server'],
    },
    {
      slug: 'telegram-bots',
      title: 'Telegram bots',
      summary: 'Three bots I use every day: car deadlines, my Pokémon TCG binder and attendance timesheets.',
      stack: ['TypeScript', 'Python', 'Telegram Bot API'],
      repoUrls: [
        'https://github.com/xdelmo/auto-scadenze-bot',
        'https://github.com/xdelmo/hoenn-binder',
        'https://github.com/xdelmo/presenz-lazy-bot',
      ],
    },
  ],
};
```

- [ ] **Step 3: Contenuti italiani `src/app/content/content.it.ts`**

Stessi `slug`, URL e `stack`; testi tradotti.

```ts
import { SiteContent } from './content.model';
import { CONTENT_EN } from './content.en';

const [apexflow, iceFriends, mcp, bots] = CONTENT_EN.projects;

export const CONTENT_IT: SiteContent = {
  person: {
    ...CONTENT_EN.person,
    location: 'Latina, Italia',
    availability: 'Disponibile per ruoli da remoto e in sede da marzo 2027.',
  },
  hero: {
    headline: 'Costruisco interfacce Angular che restano veloci anche quando i dati crescono.',
    lede: 'Frontend Engineer in IPS S.p.A., a Latina. Laureato in Ingegneria Informatica nel 2026.',
  },
  about:
    'Lavoro su frontend enterprise: tabelle grandi, filtri lato server, stato che deve restare prevedibile. La mia tesi, ApexFlow, è una dashboard CRM full-stack costruita con Angular Signals e Spring Boot.',
  projects: [
    { ...apexflow, summary: 'Una dashboard CRM e di analytics: Angular 19 con Signals e RxJS nel frontend, Spring Boot 3 e PostgreSQL nel backend.' },
    { ...iceFriends, summary: 'Un gioco di carte per rompere il ghiaccio, installabile sul telefono come PWA e come app nativa.' },
    { ...mcp, summary: 'Un server e un client Model Context Protocol che permettono a un LLM di leggere e modificare documenti tramite tool personalizzati.' },
    { ...bots, title: 'Bot Telegram', summary: "Tre bot che uso ogni giorno: scadenze dell'auto, il mio raccoglitore di carte Pokémon e i fogli presenze." },
  ],
};
```

- [ ] **Step 4: Token `src/app/content/content.ts`**

```ts
import { InjectionToken, LOCALE_ID, inject } from '@angular/core';
import { toLocale } from '../core/i18n/locale';
import { CONTENT_EN } from './content.en';
import { CONTENT_IT } from './content.it';
import { SiteContent } from './content.model';

export const CONTENT = new InjectionToken<SiteContent>('CONTENT', {
  providedIn: 'root',
  factory: () => (toLocale(inject(LOCALE_ID)) === 'it' ? CONTENT_IT : CONTENT_EN),
});
```

- [ ] **Step 5: Test di coerenza tra le lingue `src/app/content/content.spec.ts`**

```ts
import { CONTENT_EN } from './content.en';
import { CONTENT_IT } from './content.it';

describe('content', () => {
  it('has the same projects, in the same order, in both languages', () => {
    expect(CONTENT_IT.projects.map((p) => p.slug)).toEqual(CONTENT_EN.projects.map((p) => p.slug));
  });

  it('uses url-safe slugs', () => {
    for (const p of CONTENT_EN.projects) expect(p.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('translates every summary', () => {
    CONTENT_EN.projects.forEach((p, i) => expect(CONTENT_IT.projects[i].summary).not.toBe(p.summary));
  });
});
```

Run: `npx ng test --no-watch --include src/app/content/content.spec.ts`
Expected: PASS (3 test).

- [ ] **Step 6: Header `src/app/layout/site-header.ts`**

```ts
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageSwitch } from '../core/i18n/language-switch';
import { ThemeToggle } from '../core/theme/theme-toggle';

@Component({
  selector: 'app-site-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LanguageSwitch, ThemeToggle],
  template: `
    <a class="skip-link" href="#main" i18n="@@a11y.skip">Skip to content</a>
    <header class="site-header container">
      <a class="logo" routerLink="/" i18n-aria-label="@@nav.home" aria-label="Emanuele Del Monte, home">edm.</a>
      <nav i18n-aria-label="@@nav.label" aria-label="Main">
        <a routerLink="/" fragment="work" i18n="@@nav.work">Work</a>
        <a routerLink="/" fragment="about" i18n="@@nav.about">About</a>
        <a routerLink="/" fragment="contact" i18n="@@nav.contact">Contact</a>
      </nav>
      <div class="controls">
        <app-language-switch />
        <app-theme-toggle />
      </div>
    </header>
  `,
  styles: `
    .site-header {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      min-height: var(--space-12);
    }
    .logo {
      margin-right: auto;
      color: var(--fg);
      font-size: var(--step-1);
      font-weight: 700;
      text-decoration: none;
    }
    nav {
      display: none;
      gap: var(--space-3);
    }
    nav a {
      color: var(--fg);
      text-decoration: none;
    }
    nav a:hover {
      text-decoration: underline;
    }
    .controls {
      display: flex;
      align-items: center;
    }
    @media (min-width: 768px) {
      nav {
        display: flex;
      }
    }
  `,
})
export class SiteHeader {}
```

Su mobile la navigazione è nascosta: le sezioni si raggiungono scorrendo e il footer ripete i link di contatto. Un menu mobile non serve con tre voci.

- [ ] **Step 7: Footer `src/app/layout/site-footer.ts`**

```ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CONTENT } from '../content/content';

@Component({
  selector: 'app-site-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="site-footer container">
      <p>{{ content.person.name }}, {{ content.person.location }}</p>
      <ul>
        <li><a [href]="'mailto:' + content.person.email">{{ content.person.email }}</a></li>
        <li><a [href]="content.person.linkedin" rel="me">LinkedIn</a></li>
        <li><a [href]="content.person.github" rel="me">GitHub</a></li>
      </ul>
    </footer>
  `,
  styles: `
    .site-footer {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: var(--space-2);
      padding-block: var(--space-6);
      border-top: 1px solid var(--rule);
      color: var(--fg-muted);
      font-size: var(--step--1);
    }
    ul {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-3);
      margin: 0;
      padding: 0;
      list-style: none;
    }
    a {
      display: inline-block;
      min-height: 24px;
    }
  `,
})
export class SiteFooter {
  protected readonly content = inject(CONTENT);
}
```

- [ ] **Step 8: Home `src/app/pages/home/home.ts`**

```ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CONTENT } from '../../content/content';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="hero container" aria-labelledby="hero-title">
      <h1 id="hero-title">{{ content.hero.headline }}</h1>
      <p class="lede">{{ content.hero.lede }}</p>
      <p class="availability">{{ content.person.availability }}</p>
      <div class="actions">
        <a class="button button--primary" routerLink="/" fragment="work" i18n="@@home.cta.work">See my work</a>
        <a class="button" routerLink="/" fragment="contact" i18n="@@home.cta.contact">Contact me</a>
      </div>
    </section>

    <section id="work" class="section container" aria-labelledby="work-title">
      <h2 id="work-title" i18n="@@home.work.title">Selected work</h2>
      <ul class="projects">
        @for (project of content.projects; track project.slug) {
          <li>
            <h3><a [routerLink]="['/work', project.slug]">{{ project.title }}</a></h3>
            <p>{{ project.summary }}</p>
          </li>
        }
      </ul>
    </section>

    <section id="about" class="section container" aria-labelledby="about-title">
      <h2 id="about-title" i18n="@@home.about.title">About</h2>
      <p>{{ content.about }}</p>
    </section>

    <section id="contact" class="section container" aria-labelledby="contact-title">
      <h2 id="contact-title" i18n="@@home.contact.title">Get in touch</h2>
      <p>
        <a [href]="'mailto:' + content.person.email">{{ content.person.email }}</a>
      </p>
      <p class="muted" i18n="@@home.contact.cv">CV available on request.</p>
    </section>
  `,
  styles: `
    .hero {
      display: grid;
      gap: var(--space-3);
      padding-block: var(--space-12) var(--space-16);
    }
    .hero h1 {
      max-width: 16ch;
    }
    .lede {
      font-size: var(--step-1);
    }
    .availability,
    .muted {
      color: var(--fg-muted);
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
      margin-top: var(--space-2);
    }
    .section {
      display: grid;
      gap: var(--space-4);
      padding-block: var(--space-12);
      scroll-margin-top: var(--space-2);
    }
    .projects {
      display: grid;
      gap: var(--space-6);
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .projects li {
      display: grid;
      gap: var(--space-1);
    }
    .projects a {
      color: var(--fg);
    }
  `,
})
export class Home {
  protected readonly content = inject(CONTENT);
}
```

- [ ] **Step 9: Test della pagina case study `src/app/pages/case-study/case-study.spec.ts`**

```ts
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CaseStudy } from './case-study';

describe('CaseStudy', () => {
  async function render(slug: string) {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(CaseStudy);
    fixture.componentRef.setInput('slug', slug);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows the project for a known slug', async () => {
    const el = await render('apexflow');
    expect(el.querySelector('h1')?.textContent).toContain('ApexFlow');
    expect(el.querySelector('a[href="https://dashboard-tesi.vercel.app/welcome"]')).not.toBeNull();
  });

  it('shows a not-found message with a link home for an unknown slug', async () => {
    const el = await render('apexflw');
    expect(el.querySelector('h1')?.textContent).toContain('not found');
    expect(el.querySelector('a[href="/"]')).not.toBeNull();
  });
});
```

Run: `npx ng test --no-watch --include src/app/pages/case-study/case-study.spec.ts`
Expected: FAIL, `Cannot find module './case-study'`.

- [ ] **Step 10: Pagina case study `src/app/pages/case-study/case-study.ts`**

```ts
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CONTENT } from '../../content/content';

@Component({
  selector: 'app-case-study',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <article class="container case-study">
      @if (project(); as p) {
        <h1>{{ p.title }}</h1>
        <p class="summary">{{ p.summary }}</p>
        <ul class="stack" i18n-aria-label="@@case.stack" aria-label="Technologies">
          @for (tech of p.stack; track tech) {
            <li>{{ tech }}</li>
          }
        </ul>
        <p class="links">
          @if (p.demoUrl) {
            <a class="button button--primary" [href]="p.demoUrl" i18n="@@case.demo">Open the live demo</a>
          }
          @for (repo of p.repoUrls; track repo) {
            <a class="button" [href]="repo" i18n="@@case.repo">View the code on GitHub</a>
          }
        </p>
      } @else {
        <h1 i18n="@@case.notFound">Project not found</h1>
        <p><a routerLink="/" i18n="@@notFound.home">Go to the home page</a></p>
      }
    </article>
  `,
  styles: `
    .case-study {
      display: grid;
      gap: var(--space-4);
      padding-block: var(--space-12);
    }
    .summary {
      font-size: var(--step-1);
    }
    .stack {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-1) var(--space-3);
      margin: 0;
      padding: 0;
      list-style: none;
      color: var(--fg-muted);
    }
    .links {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
    }
  `,
})
export class CaseStudy {
  private readonly content = inject(CONTENT);
  readonly slug = input.required<string>();
  protected readonly project = computed(() => this.content.projects.find((p) => p.slug === this.slug()));
}
```

Quando un progetto ha più repo, i bottoni hanno lo stesso testo: il Piano 2 li etichetta per nome ("Frontend code", "Backend code"). Va bene per lo scheletro.

Run: `npx ng test --no-watch --include src/app/pages/case-study/case-study.spec.ts`
Expected: PASS (2 test).

- [ ] **Step 11: Pagina 404 `src/app/pages/not-found/not-found.ts`**

```ts
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="container not-found">
      <h1 i18n="@@notFound.title">This page doesn't exist</h1>
      <p i18n="@@notFound.text">The link may be old or mistyped.</p>
      <p><a class="button button--primary" routerLink="/" i18n="@@notFound.home">Go to the home page</a></p>
    </section>
  `,
  styles: `
    .not-found {
      display: grid;
      gap: var(--space-3);
      padding-block: var(--space-16);
    }
  `,
})
export class NotFound {}
```

- [ ] **Step 12: Route, route server e configurazione**

`src/app/app.routes.ts`:

```ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home').then((m) => m.Home) },
  { path: 'work/:slug', loadComponent: () => import('./pages/case-study/case-study').then((m) => m.CaseStudy) },
  { path: '404', loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFound) },
  { path: '**', redirectTo: '404' },
];
```

`src/app/app.routes.server.ts`:

```ts
import { RenderMode, ServerRoute } from '@angular/ssr';
import { CONTENT_EN } from './content/content.en';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'work/:slug',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return CONTENT_EN.projects.map((p) => ({ slug: p.slug }));
    },
  },
  { path: '**', renderMode: RenderMode.Prerender },
];
```

In `src/app/app.config.ts` il router diventa:

```ts
provideRouter(
  routes,
  withComponentInputBinding(),
  withViewTransitions(),
  withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }),
),
```

(importa `withComponentInputBinding`, `withViewTransitions`, `withInMemoryScrolling` da `@angular/router`; lascia invariati gli altri provider generati, compreso `provideClientHydration(withEventReplay())`).

- [ ] **Step 13: Componente radice**

`src/app/app.ts`:

```ts
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SiteFooter } from './layout/site-footer';
import { SiteHeader } from './layout/site-header';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, SiteHeader, SiteFooter],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
```

`src/app/app.html`:

```html
<app-site-header />
<main id="main" tabindex="-1">
  <router-outlet />
</main>
<app-site-footer />
```

`src/app/app.css`:

```css
:host {
  display: flex;
  flex-direction: column;
  min-height: 100svh;
}

main {
  flex: 1;
  outline: none;
}
```

Sostituisci `src/app/app.spec.ts` con:

```ts
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  it('renders header, main landmark and footer', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('header')).not.toBeNull();
    expect(el.querySelector('main#main')).not.toBeNull();
    expect(el.querySelector('footer')).not.toBeNull();
  });
});
```

- [ ] **Step 14: Estrai le stringhe e scrivi la traduzione italiana**

Run: `npm run i18n:extract`
Expected: `src/locale/messages.xlf` con le unità `@@theme.toLight`, `@@theme.toDark`, `@@a11y.skip`, `@@nav.home`, `@@nav.label`, `@@nav.work`, `@@nav.about`, `@@nav.contact`, `@@home.cta.work`, `@@home.cta.contact`, `@@home.work.title`, `@@home.about.title`, `@@home.contact.title`, `@@home.contact.cv`, `@@case.stack`, `@@case.demo`, `@@case.repo`, `@@case.notFound`, `@@notFound.title`, `@@notFound.text`, `@@notFound.home`.

Copia il file in `src/locale/messages.it.xlf`, aggiungi `target-language="it"` all'elemento `<file>` e, in ogni `<trans-unit>`, un `<target>` subito dopo `<source>`:

| ID | Italiano |
|---|---|
| `theme.toLight` | Passa al tema chiaro |
| `theme.toDark` | Passa al tema scuro |
| `a11y.skip` | Vai al contenuto |
| `nav.home` | Emanuele Del Monte, home |
| `nav.label` | Principale |
| `nav.work` | Progetti |
| `nav.about` | Chi sono |
| `nav.contact` | Contatti |
| `home.cta.work` | Guarda i progetti |
| `home.cta.contact` | Scrivimi |
| `home.work.title` | Progetti selezionati |
| `home.about.title` | Chi sono |
| `home.contact.title` | Contatti |
| `home.contact.cv` | CV disponibile su richiesta. |
| `case.stack` | Tecnologie |
| `case.demo` | Apri la demo |
| `case.repo` | Vedi il codice su GitHub |
| `case.notFound` | Progetto non trovato |
| `notFound.title` | Questa pagina non esiste |
| `notFound.text` | Il link potrebbe essere vecchio o scritto male. |
| `notFound.home` | Vai alla home |

`messages.xlf` (il sorgente estratto) resta fuori da git, come impostato nel Task 4.

- [ ] **Step 15: Build e verifica delle pagine prerenderizzate**

```bash
npx ng test --no-watch && npx ng build
ls dist/portfolio/browser/en dist/portfolio/browser/it
ls dist/portfolio/browser/en/work dist/portfolio/browser/en/404
grep -o '<html lang="[a-z]*"' dist/portfolio/browser/it/index.html
grep -o 'Costruisco interfacce Angular' dist/portfolio/browser/it/index.html
grep -o 'Progetto non trovato\|ApexFlow' dist/portfolio/browser/it/work/apexflow/index.html | head -1
```

Expected: test PASS; in `en/` e `it/` ci sono `index.html`, `work/<slug>/index.html` per i 4 progetti e `404/index.html`; `lang="it"`; il titolo italiano è nell'HTML; la pagina di ApexFlow contiene `ApexFlow`.

- [ ] **Step 16: Controllo visivo**

Run: `npx http-server dist/portfolio/browser -p 4300 -s` in background, poi apri con Claude in Chrome `http://localhost:4300/en/` e `http://localhost:4300/it/` a 375 px e 1440 px di larghezza, in tema chiaro e scuro (toggle). Fai uno screenshot di ciascuno e confrontalo con la sezione "Sistema visivo": titolo condensato a sinistra, misura dei paragrafi ≤ 68 caratteri, niente etichette in maiuscolo, focus visibile premendo Tab. Correggi gli scostamenti nel CSS dei componenti. Ferma il server alla fine.

- [ ] **Step 17: Commit**

```bash
git add -A
git commit -m "feat: add typed bilingual content, site layout and pages

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: SEO tecnica

**Files:**
- Create: `src/app/core/seo/seo.ts`, `src/app/core/seo/seo.service.ts`, `scripts/seo-files.mjs`, `scripts/postbuild.mjs`
- Modify: `src/app/pages/home/home.ts`, `src/app/pages/case-study/case-study.ts`, `src/app/pages/not-found/not-found.ts`, `package.json`, `netlify.toml`
- Test: `src/app/core/seo/seo.spec.ts`, `scripts/seo-files.test.mjs`

**Interfaces:**
- Consumes: `Locale`, `toLocale` (Task 4); `CONTENT`, `SiteContent`, `Person` (Task 5).
- Produces:
  - `const SITE_URL = 'https://www.emanueledelmonte.it'`
  - `pageUrl(path: string, locale: Locale): string`
  - `interface HeadLink { rel: 'canonical' | 'alternate'; href: string; hreflang?: 'en' | 'it' | 'x-default' }`
  - `headLinks(path: string, locale: Locale): HeadLink[]`
  - `personJsonLd(person: Person, locale: Locale): Record<string, unknown>`
  - `SeoService.update(page: { path: string; title: string; description: string; noindex?: boolean }): void`
  - `SeoService.setJsonLd(id: string, data: Record<string, unknown> | null): void`
  - script: `sitemapXml(pages)`, `robotsTxt(siteUrl)`, `extractSeoLinks(html)`

- [ ] **Step 1: Test delle funzioni pure `src/app/core/seo/seo.spec.ts`**

```ts
import { CONTENT_EN } from '../../content/content.en';
import { headLinks, pageUrl, personJsonLd } from './seo';

describe('pageUrl', () => {
  it('keeps the trailing slash on the home page only', () => {
    expect(pageUrl('/', 'en')).toBe('https://www.emanueledelmonte.it/en/');
    expect(pageUrl('/work/apexflow', 'it')).toBe('https://www.emanueledelmonte.it/it/work/apexflow');
    expect(pageUrl('/work/apexflow/', 'it')).toBe('https://www.emanueledelmonte.it/it/work/apexflow');
  });

  it('drops query and fragment', () => {
    expect(pageUrl('/work/apexflow?ref=x#top', 'en')).toBe('https://www.emanueledelmonte.it/en/work/apexflow');
  });
});

describe('headLinks', () => {
  it('returns canonical plus en, it and x-default alternates', () => {
    expect(headLinks('/work/apexflow', 'it')).toEqual([
      { rel: 'canonical', href: 'https://www.emanueledelmonte.it/it/work/apexflow' },
      { rel: 'alternate', hreflang: 'en', href: 'https://www.emanueledelmonte.it/en/work/apexflow' },
      { rel: 'alternate', hreflang: 'it', href: 'https://www.emanueledelmonte.it/it/work/apexflow' },
      { rel: 'alternate', hreflang: 'x-default', href: 'https://www.emanueledelmonte.it/en/work/apexflow' },
    ]);
  });
});

describe('personJsonLd', () => {
  it('describes the person with consistent identity links', () => {
    const ld = personJsonLd(CONTENT_EN.person, 'en');
    expect(ld['@type']).toBe('Person');
    expect(ld['name']).toBe('Emanuele Del Monte');
    expect(ld['url']).toBe('https://www.emanueledelmonte.it/en/');
    expect(ld['sameAs']).toEqual([CONTENT_EN.person.linkedin, CONTENT_EN.person.github]);
    expect(ld['alumniOf']).toEqual({ '@type': 'CollegeOrUniversity', name: 'Università Mercatorum' });
  });
});
```

Run: `npx ng test --no-watch --include src/app/core/seo/seo.spec.ts`
Expected: FAIL, `Cannot find module './seo'`.

- [ ] **Step 2: Implementa `src/app/core/seo/seo.ts`**

```ts
import { Person } from '../../content/content.model';
import { Locale } from '../i18n/locale';

export const SITE_URL = 'https://www.emanueledelmonte.it';

export interface HeadLink {
  rel: 'canonical' | 'alternate';
  href: string;
  hreflang?: 'en' | 'it' | 'x-default';
}

export function pageUrl(path: string, locale: Locale): string {
  const clean = path.split(/[?#]/)[0].replace(/\/+$/, '');
  return `${SITE_URL}/${locale}${clean === '' ? '/' : clean}`;
}

export function headLinks(path: string, locale: Locale): HeadLink[] {
  return [
    { rel: 'canonical', href: pageUrl(path, locale) },
    { rel: 'alternate', hreflang: 'en', href: pageUrl(path, 'en') },
    { rel: 'alternate', hreflang: 'it', href: pageUrl(path, 'it') },
    { rel: 'alternate', hreflang: 'x-default', href: pageUrl(path, 'en') },
  ];
}

export function personJsonLd(person: Person, locale: Locale): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: person.name,
    url: pageUrl('/', locale),
    jobTitle: person.role,
    worksFor: { '@type': 'Organization', name: person.employer },
    alumniOf: { '@type': 'CollegeOrUniversity', name: 'Università Mercatorum' },
    address: { '@type': 'PostalAddress', addressLocality: 'Latina', addressCountry: 'IT' },
    email: `mailto:${person.email}`,
    sameAs: [person.linkedin, person.github],
    knowsAbout: person.knowsAbout,
  };
}
```

Run: `npx ng test --no-watch --include src/app/core/seo/seo.spec.ts`
Expected: PASS (4 test).

- [ ] **Step 3: Implementa `src/app/core/seo/seo.service.ts`**

```ts
import { DOCUMENT, Injectable, LOCALE_ID, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { toLocale } from '../i18n/locale';
import { headLinks, pageUrl } from './seo';

export interface PageSeo {
  path: string;
  title: string;
  description: string;
  noindex?: boolean;
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly doc = inject(DOCUMENT);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly locale = toLocale(inject(LOCALE_ID));

  update(page: PageSeo): void {
    const url = pageUrl(page.path, this.locale);
    this.title.setTitle(page.title);
    this.meta.updateTag({ name: 'description', content: page.description });
    this.meta.updateTag({ name: 'robots', content: page.noindex ? 'noindex' : 'index,follow' });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:title', content: page.title });
    this.meta.updateTag({ property: 'og:description', content: page.description });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:locale', content: this.locale === 'it' ? 'it_IT' : 'en_US' });
    this.meta.updateTag({ property: 'og:locale:alternate', content: this.locale === 'it' ? 'en_US' : 'it_IT' });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });

    this.doc.head.querySelectorAll('link[data-seo]').forEach((el) => el.remove());
    if (page.noindex) return;
    for (const link of headLinks(page.path, this.locale)) {
      const el = this.doc.createElement('link');
      el.setAttribute('rel', link.rel);
      el.setAttribute('href', link.href);
      if (link.hreflang) el.setAttribute('hreflang', link.hreflang);
      el.setAttribute('data-seo', '');
      this.doc.head.appendChild(el);
    }
  }

  setJsonLd(id: string, data: Record<string, unknown> | null): void {
    this.doc.getElementById(id)?.remove();
    if (!data) return;
    const script = this.doc.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    this.doc.head.appendChild(script);
  }
}
```

- [ ] **Step 4: Usa il servizio nelle pagine**

In `Home` aggiungi:

```ts
private readonly seo = inject(SeoService);
private readonly locale = toLocale(inject(LOCALE_ID));

constructor() {
  const { person } = this.content;
  this.seo.update({
    path: '/',
    title: `${person.name} — ${person.role}`,
    description: `${this.content.hero.lede} ${person.availability}`,
  });
  this.seo.setJsonLd('ld-person', personJsonLd(person, this.locale));
}
```

In `CaseStudy` (con `effect` di `@angular/core`, perché `slug` è un input):

```ts
private readonly seo = inject(SeoService);

constructor() {
  effect(() => {
    const p = this.project();
    this.seo.setJsonLd('ld-person', null);
    this.seo.update(
      p
        ? { path: `/work/${p.slug}`, title: `${p.title} — Emanuele Del Monte`, description: p.summary }
        : { path: `/work/${this.slug()}`, title: 'Emanuele Del Monte', description: '', noindex: true },
    );
  });
}
```

In `NotFound`:

```ts
constructor() {
  inject(SeoService).update({ path: '/404', title: 'Emanuele Del Monte', description: '', noindex: true });
}
```

(import di `inject`, `LOCALE_ID`, `effect`, `SeoService`, `personJsonLd`, `toLocale` dove servono).

- [ ] **Step 5: Test degli script di build `scripts/seo-files.test.mjs`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractSeoLinks, robotsTxt, sitemapXml } from './seo-files.mjs';

const html = `<head>
<link rel="canonical" href="https://www.emanueledelmonte.it/en/work/apexflow" data-seo="">
<link rel="alternate" href="https://www.emanueledelmonte.it/en/work/apexflow" hreflang="en" data-seo="">
<link rel="alternate" href="https://www.emanueledelmonte.it/it/work/apexflow" hreflang="it" data-seo="">
</head>`;

test('extractSeoLinks reads canonical and alternates whatever the attribute order', () => {
  assert.deepEqual(extractSeoLinks(html), {
    canonical: 'https://www.emanueledelmonte.it/en/work/apexflow',
    alternates: [
      { hreflang: 'en', href: 'https://www.emanueledelmonte.it/en/work/apexflow' },
      { hreflang: 'it', href: 'https://www.emanueledelmonte.it/it/work/apexflow' },
    ],
  });
});

test('extractSeoLinks returns null for pages without canonical (noindex)', () => {
  assert.equal(extractSeoLinks('<head></head>'), null);
});

test('sitemapXml lists each page with its alternates', () => {
  const xml = sitemapXml([extractSeoLinks(html)]);
  assert.match(xml, /<loc>https:\/\/www\.emanueledelmonte\.it\/en\/work\/apexflow<\/loc>/);
  assert.match(xml, /<xhtml:link rel="alternate" hreflang="it" href="https:\/\/www\.emanueledelmonte\.it\/it\/work\/apexflow"\/>/);
  assert.match(xml, /^<\?xml version="1.0" encoding="UTF-8"\?>/);
});

test('robotsTxt allows everyone, names AI crawlers and points to the sitemap', () => {
  const txt = robotsTxt('https://www.emanueledelmonte.it');
  for (const bot of ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended']) {
    assert.match(txt, new RegExp(`User-agent: ${bot}`));
  }
  assert.match(txt, /Sitemap: https:\/\/www\.emanueledelmonte\.it\/sitemap\.xml/);
  assert.doesNotMatch(txt, /Disallow: \//);
});
```

Run: `node --test scripts/`
Expected: FAIL, `Cannot find module './seo-files.mjs'`.

- [ ] **Step 6: Implementa `scripts/seo-files.mjs`**

```js
const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'PerplexityBot',
  'Google-Extended',
  'Applebot-Extended',
];

function attr(tag, name) {
  return tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];
}

export function extractSeoLinks(html) {
  const tags = html.match(/<link\b[^>]*>/g) ?? [];
  let canonical = null;
  const alternates = [];
  for (const tag of tags) {
    const rel = attr(tag, 'rel');
    if (rel === 'canonical') canonical = attr(tag, 'href');
    if (rel === 'alternate' && attr(tag, 'hreflang') && attr(tag, 'hreflang') !== 'x-default') {
      alternates.push({ hreflang: attr(tag, 'hreflang'), href: attr(tag, 'href') });
    }
  }
  return canonical ? { canonical, alternates } : null;
}

export function sitemapXml(pages) {
  const urls = pages
    .map(
      (p) =>
        `  <url>\n    <loc>${p.canonical}</loc>\n` +
        p.alternates.map((a) => `    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${a.href}"/>\n`).join('') +
        `  </url>`,
    )
    .join('\n');
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
    `${urls}\n</urlset>\n`
  );
}

export function robotsTxt(siteUrl) {
  return (
    `User-agent: *\nAllow: /\n\n` +
    `# AI search and assistant crawlers are welcome\n` +
    AI_CRAWLERS.map((bot) => `User-agent: ${bot}`).join('\n') +
    `\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`
  );
}
```

Run: `node --test scripts/`
Expected: PASS (4 test).

- [ ] **Step 7: Implementa `scripts/postbuild.mjs`**

```js
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { extractSeoLinks, robotsTxt, sitemapXml } from './seo-files.mjs';

const ROOT = 'dist/portfolio/browser';
const SITE_URL = 'https://www.emanueledelmonte.it';

async function htmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  return entries
    .filter((e) => e.isFile() && e.name === 'index.html')
    .map((e) => join(e.parentPath ?? e.path, e.name));
}

const pages = [];
for (const locale of ['en', 'it']) {
  for (const file of await htmlFiles(join(ROOT, locale))) {
    const links = extractSeoLinks(await readFile(file, 'utf8'));
    if (links) pages.push(links);
  }
}
pages.sort((a, b) => a.canonical.localeCompare(b.canonical));

if (pages.length === 0) throw new Error('postbuild: no indexable pages found, is the build output where expected?');

await writeFile(join(ROOT, 'sitemap.xml'), sitemapXml(pages));
await writeFile(join(ROOT, 'robots.txt'), robotsTxt(SITE_URL));
console.log(`postbuild: sitemap.xml with ${pages.length} pages, robots.txt`);
```

In `package.json`: `"build": "ng build && node scripts/postbuild.mjs"`.

- [ ] **Step 8: Redirect di dominio, vecchi URL e 404 in `netlify.toml`**

Aggiungi **prima** dei redirect di lingua del Task 4 (Netlify applica la prima regola che corrisponde):

```toml
# Canonical domain
[[redirects]]
  from = "https://emanueledelmonte.it/*"
  to = "https://www.emanueledelmonte.it/:splat"
  status = 301
  force = true

[[redirects]]
  from = "https://emanueledelmonte.netlify.app/*"
  to = "https://www.emanueledelmonte.it/:splat"
  status = 301
  force = true

# Old Gatsby URLs (the old site was in Italian)
[[redirects]]
  from = "/privacy"
  to = "/it/"
  status = 301

[[redirects]]
  from = "/imprint"
  to = "/it/"
  status = 301

[[redirects]]
  from = "/blog/*"
  to = "/it/"
  status = 301

[[redirects]]
  from = "/my-first-article"
  to = "/it/"
  status = 301
```

E **dopo** i redirect di lingua:

```toml
# Per-locale 404 pages (only used when no file matches)
[[redirects]]
  from = "/it/*"
  to = "/it/404/index.html"
  status = 404

[[redirects]]
  from = "/en/*"
  to = "/en/404/index.html"
  status = 404

[[redirects]]
  from = "/*"
  to = "/en/404/index.html"
  status = 404
```

- [ ] **Step 9: Build e verifica**

```bash
npx ng test --no-watch && node --test scripts/ && npm run build
grep -o '<link rel="canonical"[^>]*>' dist/portfolio/browser/it/work/apexflow/index.html
grep -c 'application/ld+json' dist/portfolio/browser/en/index.html
grep -c '<url>' dist/portfolio/browser/sitemap.xml
grep -c 'noindex' dist/portfolio/browser/en/404/index.html
head -3 dist/portfolio/browser/robots.txt
```

Expected: tutti i test PASS; canonical `https://www.emanueledelmonte.it/it/work/apexflow`; `1` JSON-LD; `10` URL nella sitemap (home + 4 progetti, × 2 lingue; la 404 esclusa); `1` noindex; robots che inizia con `User-agent: *`.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: add technical SEO, sitemap/robots generation and Netlify redirects

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Test end-to-end, accessibilità, Lighthouse CI e CI

**Files:**
- Create: `playwright.config.ts`, `e2e/pages.spec.ts`, `e2e/theme.spec.ts`, `e2e/i18n.spec.ts`, `e2e/layout.spec.ts`, `lighthouserc.json`, `.github/workflows/ci.yml`
- Modify: `package.json`

**Interfaces:**
- Consumes: build in `dist/portfolio/browser` (Task 6); `data-theme` (Task 3); link `.language-switch` (Task 4); pagine e 404 (Task 5); link SEO (Task 6).
- Produces: script `e2e`, `lhci`; workflow CI che gira su push e PR verso `v2` e `master`.

- [ ] **Step 1: Installa le dipendenze**

```bash
npm install -D @playwright/test@1.63.0 @axe-core/playwright@4.13.0 @lhci/cli@0.15.1 http-server
npx playwright install chromium firefox webkit
```

Script in `package.json`:

```json
"e2e": "playwright test",
"lhci": "lhci autorun"
```

- [ ] **Step 2: `playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? 'github' : 'list',
  use: { baseURL: 'http://localhost:4300' },
  webServer: {
    command: 'npx http-server dist/portfolio/browser -p 4300 -s -c-1',
    url: 'http://localhost:4300/en/',
    reuseExistingServer: !process.env['CI'],
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'iphone', use: { ...devices['iPhone 15'] } },
    { name: 'android', use: { ...devices['Pixel 7'] } },
  ],
});
```

- [ ] **Step 3: `e2e/pages.spec.ts`**

```ts
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const PAGES = ['/en/', '/it/', '/en/work/apexflow', '/it/work/apexflow', '/en/404', '/it/404'];

for (const path of PAGES) {
  test.describe(path, () => {
    test('loads without console errors and scrolls to the footer', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(path);
      await expect(page.locator('h1')).toHaveCount(1);
      await page.locator('footer').scrollIntoViewIfNeeded();
      await expect(page.locator('footer')).toBeInViewport();
      expect(errors).toEqual([]);
    });

    test('has no accessibility violations', async ({ page }) => {
      await page.goto(path);
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    });
  });
}

test('pages declare the right language', async ({ page }) => {
  await page.goto('/it/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'it');
  await page.goto('/en/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('case study has canonical and hreflang links', async ({ page }) => {
  await page.goto('/it/work/apexflow');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://www.emanueledelmonte.it/it/work/apexflow');
  await expect(page.locator('link[hreflang="en"]')).toHaveAttribute('href', 'https://www.emanueledelmonte.it/en/work/apexflow');
  await expect(page.locator('link[hreflang="x-default"]')).toHaveCount(1);
});

test('the 404 page is localized and offers a way home', async ({ page }) => {
  await page.goto('/it/404');
  await expect(page.locator('h1')).toHaveText('Questa pagina non esiste');
  await expect(page.getByRole('link', { name: 'Vai alla home' })).toBeVisible();
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('content is still there', async ({ page }) => {
    await page.goto('/en/');
    await expect(page.locator('h1')).toContainText('Angular');
    await expect(page.getByRole('link', { name: 'ApexFlow' })).toBeVisible();
  });
});
```

- [ ] **Step 4: `e2e/theme.spec.ts`**

```ts
import { expect, test } from '@playwright/test';

test('follows the system theme on first visit, before the app boots', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/en/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('the toggle switches theme and the choice survives a reload', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/en/');
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('button', { name: 'Switch to light theme' })).toBeVisible();
});

test('the toggle label is translated', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/it/');
  await expect(page.getByRole('button', { name: 'Passa al tema scuro' })).toBeVisible();
});
```

- [ ] **Step 5: `e2e/i18n.spec.ts`**

```ts
import { expect, test } from '@playwright/test';

test('the language switch points to the same page in the other language', async ({ page }) => {
  await page.goto('/en/work/apexflow');
  await expect(page.locator('a.language-switch')).toHaveAttribute('href', '/it/work/apexflow');
  await page.goto('/it/');
  await expect(page.locator('a.language-switch')).toHaveAttribute('href', '/en/');
});

test('using the switch remembers the choice for Netlify', async ({ page, context }) => {
  await page.goto('/en/');
  await page.locator('a.language-switch').click();
  await expect(page).toHaveURL(/\/it\/$/);
  const cookies = await context.cookies();
  expect(cookies.find((c) => c.name === 'nf_lang')?.value).toBe('it');
});
```

- [ ] **Step 6: `e2e/layout.spec.ts`**

```ts
import { expect, test } from '@playwright/test';

const WIDTHS = [320, 375, 768, 1024, 1440, 1920];

for (const width of WIDTHS) {
  test(`no horizontal scroll at ${width}px`, async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'widths are checked once, in Chromium');
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/en/', '/it/work/apexflow']) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${path} at ${width}px`).toBeLessThanOrEqual(0);
    }
  });
}

test('keyboard users can skip to the content', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'Safari does not Tab to links by default');
  await page.goto('/en/');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to content' });
  await expect(skip).toBeFocused();
  await skip.press('Enter');
  await expect(page).toHaveURL(/#main$/);
});
```

- [ ] **Step 7: Esegui tutta la suite**

Run: `npm run build && npm run e2e`
Expected: tutti i test PASS su chromium, firefox, webkit, iphone, android. Se fallisce un test axe, correggi il componente (contrasto, etichette, landmark), non il test.

- [ ] **Step 8: `lighthouserc.json`**

L'audit `canonical` è spento perché in locale il canonical punta (correttamente) al dominio di produzione: lo copre già il test Playwright del canonical.

```json
{
  "ci": {
    "collect": {
      "staticDistDir": "dist/portfolio/browser",
      "url": [
        "http://localhost/en/",
        "http://localhost/it/",
        "http://localhost/en/work/apexflow",
        "http://localhost/it/work/apexflow"
      ],
      "numberOfRuns": 1
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.95 }],
        "categories:accessibility": ["error", { "minScore": 1 }],
        "categories:best-practices": ["error", { "minScore": 1 }],
        "categories:seo": ["error", { "minScore": 1 }],
        "canonical": "off"
      }
    },
    "upload": { "target": "filesystem", "outputDir": ".lighthouseci" }
  }
}
```

Run: `npm run lhci`
Expected: tutte le asserzioni verdi. Se la categoria SEO resta sotto 1 per colpa del solo audit `canonical` spento, verifica nel report che nessun altro audit SEO fallisca.

- [ ] **Step 9: `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: [v2, master]
  pull_request:
    branches: [v2, master]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npx ng test --no-watch
      - run: node --test scripts/
      - run: npm run build
      - run: npx playwright install --with-deps chromium firefox webkit
      - run: npm run e2e
      - run: npm run lhci
      - if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: reports
          path: |
            playwright-report
            .lighthouseci
```

- [ ] **Step 10: Commit e push**

```bash
git add -A
git commit -m "test: add Playwright, axe, Lighthouse CI and GitHub Actions

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push -u origin v2
```

Expected: il workflow CI parte su GitHub. Controllalo con `gh run watch` e correggi finché non è verde.

---

### Task 8: Anteprima Netlify e verifica dei redirect

**Files:**
- Modify: nessuno (salvo correzioni a `netlify.toml` se una verifica fallisce)

**Interfaces:**
- Consumes: tutto il resto del piano.
- Produces: URL dell'anteprima del branch `v2`, verifiche dei redirect.

- [ ] **Step 1: Attiva il deploy del branch (lo fa Emanuele)**

Su Netlify: *Site configuration → Build & deploy → Branches and deploy contexts → Branch deploys → Let me add individual branches → `v2`*. Il primo push dopo questa impostazione crea `https://v2--<nome-sito>.netlify.app`. Il sito di produzione su `master` non cambia.

- [ ] **Step 2: Verifica i redirect di lingua (incluso il Review Focus #2)**

```bash
P=https://v2--<nome-sito>.netlify.app
curl -sI -H 'Accept-Language: it-IT,it;q=0.9,en;q=0.8' "$P/" | grep -i '^location'
curl -sI -H 'Accept-Language: it-CH' "$P/" | grep -i '^location'
curl -sI -H 'Accept-Language: de-DE,de;q=0.9' "$P/" | grep -i '^location'
curl -sI -H 'Accept-Language: it-IT' -H 'Cookie: nf_lang=en' "$P/" | grep -i '^location'
```

Expected: `/it/`, `/it/`, `/en/`, `/en/`. Se `it-IT` porta a `/en/`, cambia la condizione in `Language = ["it", "it-IT", "it-CH"]` e ripeti.

- [ ] **Step 3: Verifica i vecchi URL e la 404 (Review Focus #3 e #5)**

```bash
for u in /privacy /imprint /blog/x /my-first-article; do printf "%s " "$u"; curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" "$P$u"; done
curl -s -o /dev/null -w "%{http_code}\n" "$P/en/work/apexflw"
curl -s "$P/it/work/apexflw" | grep -o 'Questa pagina non esiste'
curl -s -o /dev/null -w "%{http_code}\n" "$P/sitemap.xml"
curl -s -o /dev/null -w "%{http_code}\n" "$P/robots.txt"
```

Expected: quattro `301 …/it/`; `404`; il testo italiano della 404; `200` e `200`.

- [ ] **Step 4: Prova manuale veloce dall'anteprima**

Apri l'anteprima con Claude in Chrome e su un telefono vero: home in entrambe le lingue, toggle del tema, cambio lingua da un case study, link "Skip to content" con Tab. Annota qualunque problema come task di correzione prima di chiudere il piano.

- [ ] **Step 5: Commit delle eventuali correzioni e chiusura**

```bash
git add -A
git commit -m "fix: adjust Netlify redirects after preview checks

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
```

Se non ci sono state correzioni, salta il commit.

---

### Task 9: ESLint in strict mode

Aggiunto su richiesta di Emanuele durante l'esecuzione (spec §2 "Qualità del codice").

**Files:**
- Create: `eslint.config.js` (generato da `ng add angular-eslint`, poi reso strict)
- Modify: `angular.json` (target `lint`), `package.json` (script `lint`), `.github/workflows/ci.yml`, `CLAUDE.md`, file sorgente che violano le regole

**Interfaces:**
- Consumes: tutto il codice dei Task 1–7.
- Produces: `npm run lint` = `ng lint --max-warnings=0`; step `npm run lint` in CI prima dei test.

- [ ] **Step 1: Aggiungi angular-eslint**

Run: `npx ng add angular-eslint --skip-confirmation`
Expected: `eslint.config.js` creato, target `lint` in `angular.json`.

- [ ] **Step 2: Rendi la configurazione strict e type-aware**

In `eslint.config.js`, nel blocco dei file `**/*.ts`:
- sostituisci `tseslint.configs.recommended` con `tseslint.configs.strictTypeChecked` e `tseslint.configs.stylistic` con `tseslint.configs.stylisticTypeChecked`;
- aggiungi `languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname } }`;
- mantieni `angular.configs.tsRecommended` e le regole `@angular-eslint/directive-selector` / `component-selector` con prefisso `app`;
- aggiungi `'@angular-eslint/prefer-on-push-component-change-detection': 'error'`.

Nel blocco dei file `**/*.html`: `angular.configs.templateRecommended` e `angular.configs.templateAccessibility`.

Aggiungi in testa un blocco `{ ignores: ['dist/', '.angular/', 'coverage/', '.lighthouseci/', 'playwright-report/', 'test-results/'] }`. I file `e2e/**/*.ts`, `playwright.config.ts` e `scripts/**/*.mjs` sono lintati con le stesse regole TypeScript dove applicabili (gli `.mjs` con `tseslint.configs.disableTypeChecked`).

- [ ] **Step 3: Verifica che la configurazione sia davvero strict (RED)**

Crea `src/app/lint-probe.ts`:

```ts
export function probe(value: any) {
  return value!;
}
```

Run: `npx ng lint`
Expected: errori `@typescript-eslint/no-explicit-any` e `@typescript-eslint/no-unsafe-return` (o `no-non-null-assertion`) su `lint-probe.ts`. Poi elimina il file.

- [ ] **Step 4: Correggi il codice esistente (GREEN)**

Run: `npx ng lint --max-warnings=0`
Correggi ogni violazione nel codice, non disattivando le regole. Una regola si può spegnere solo per un file preciso e con un commento che spiega perché (es. `no-non-null-assertion` nei test).

Expected finale: `All files pass linting.`

- [ ] **Step 5: Script, CI e documentazione**

`package.json`: `"lint": "ng lint --max-warnings=0"`. In `.github/workflows/ci.yml` aggiungi `- run: npm run lint` subito dopo `npm ci`. In `CLAUDE.md`, tra i comandi: ``- `npm run lint` — ESLint strict (typescript-eslint strictTypeChecked + angular-eslint), zero warnings allowed``.

- [ ] **Step 6: Suite completa e commit**

Run: `npm run lint && npx ng test --no-watch && npm run test:scripts && npm run build && npm run e2e`
Expected: tutto verde.

```bash
git add -A
git commit -m "chore: add strict ESLint (typescript-eslint strictTypeChecked + angular-eslint)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Da CSS a SCSS

Aggiunto su richiesta di Emanuele durante l'esecuzione (spec §2 "Stili").

**Files:**
- Rename: `src/styles.css` → `src/styles.scss`, `src/styles/tokens.css` → `src/styles/_tokens.scss`, `src/styles/base.css` → `src/styles/_base.scss`, `src/app/app.css` → `src/app/app.scss`
- Create: `src/styles/_breakpoints.scss`
- Modify: `angular.json`, `src/app/app.ts`, componenti con media query

**Interfaces:**
- Consumes: token e classi del Task 2.
- Produces: mixin `@include bp.up(md)` (768 px) da `src/styles/_breakpoints.scss`; nuovi componenti generati con stili SCSS.

- [ ] **Step 1: Configura Angular per SCSS**

In `angular.json`: `projects.portfolio.schematics` = `{ "@schematics/angular:component": { "style": "scss" } }`; in `architect.build.options` `"inlineStyleLanguage": "scss"` e `"styles": ["src/styles.scss"]`; idem nel target `test` se ha una lista `styles`.

- [ ] **Step 2: Rinomina i file globali e usa `@use`**

```bash
git mv src/styles.css src/styles.scss
git mv src/styles/tokens.css src/styles/_tokens.scss
git mv src/styles/base.css src/styles/_base.scss
git mv src/app/app.css src/app/app.scss
```

`src/styles.scss`:

```scss
@use '@fontsource-variable/instrument-sans/wdth.css';
@use 'styles/tokens';
@use 'styles/base';
```

In `src/app/app.ts`: `styleUrl: './app.scss'`.

- [ ] **Step 3: Mixin dei breakpoint `src/styles/_breakpoints.scss`**

```scss
$breakpoints: (
  md: 768px,
  lg: 1024px,
);

@mixin up($name) {
  @media (min-width: map-get($breakpoints, $name)) {
    @content;
  }
}
```

Sostituisci le media query `(min-width: 768px)` in `_tokens.scss` e in `site-header.ts` con `@include bp.up(md) { … }` (`@use '../styles/breakpoints' as bp;` nei componenti; nei file globali `@use 'breakpoints' as bp;`). Se `@use` con percorso relativo dentro gli stili inline dei componenti non risolve, aggiungi `"stylePreprocessorOptions": { "includePaths": ["src"] }` e usa `@use 'styles/breakpoints' as bp;`.

- [ ] **Step 4: Verifica che l'output non cambi**

Run: `npm run build && grep -o "font-stretch:[^;}]*" dist/portfolio/browser/en/styles-*.css | head -1 && npm run e2e && npm run lhci`
Expected: build verde, `font-stretch:75% 100%`, e2e e Lighthouse verdi come prima (nessuna regressione visiva: confronta uno screenshot della home a 375 e 1440 px con quelli del Task 5).

- [ ] **Step 5: Aggiorna CLAUDE.md e commit**

In `CLAUDE.md` sostituisci `src/styles/tokens.css` con `src/styles/_tokens.scss` e aggiungi alle convenzioni: "Styles are SCSS (`inlineStyleLanguage: scss`); colors stay CSS custom properties because the theme switches them at runtime; use `@include bp.up(md)` from `src/styles/_breakpoints.scss` for breakpoints."

```bash
git add -A
git commit -m "refactor: switch styles from CSS to SCSS

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
