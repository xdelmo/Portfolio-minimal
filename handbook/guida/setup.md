# Setup e comandi

Serve Node 24 (vedi `.nvmrc`).

```bash
nvm use
npm ci
npm start   # entrambi i dev server: http://localhost:4200
```

`npm start` avvia il server inglese su `/en/` e quello italiano su `/it/` (in proxy dalla porta 4201), così il selettore di lingua funziona anche in locale.

## Comandi

| Comando | Cosa fa |
|---|---|
| `npm start` | i due dev server |
| `npm run start:it` | solo il dev server italiano |
| `npm run build` | prerender di entrambe le lingue in `dist/portfolio/browser/{en,it}` più sitemap e robots |
| `npm run verify:quick` | lint, test unitari e test degli script, circa un minuto |
| `npm run verify` | l'intero gate della CI: lint, unit, script, build, e2e |
| `npm run lint` | ESLint strict, zero warning |
| `npx ng test --no-watch` | test unitari (Vitest) |
| `npm run e2e` | Playwright sul sito già buildato |
| `npm run e2e:webkit` | WebKit e iPhone nell'immagine Playwright della CI, via Docker |
| `npm run lhci` | Lighthouse CI sul sito buildato |
| `npm run i18n:extract` | rigenera le stringhe da tradurre |
| `npm run og:images` | rigenera le immagini Open Graph |
| `npm run verify:deploy -- <url>` | controlla redirect, 404, header e file SEO di un deploy |

!!! warning "Non usare `ng build --localize=en` per una prova veloce"
    Scrive un layout senza la cartella `en/` e il server degli e2e smette di funzionare. Usa `npm run build`.

## Questo handbook

```bash
python3 -m venv .venv && .venv/bin/pip install -r handbook/requirements.txt
node scripts/handbook-check.mjs            # niente dati sensibili
.venv/bin/mkdocs serve                     # http://127.0.0.1:8000
.venv/bin/mkdocs build --strict            # come in CI
```

Le pagine sono in `handbook/`, la navigazione in `mkdocs.yml`.
