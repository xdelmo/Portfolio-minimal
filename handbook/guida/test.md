# Test e qualità

## I livelli

| Livello | Strumento | Cosa copre |
|---|---|---|
| Lint | ESLint (typescript-eslint `strictTypeChecked`, angular-eslint, a11y dei template) | zero warning, gira anche in `pre-commit` |
| Unit | Vitest | le funzioni pure e i componenti, con `testProviders()` per i TestBed |
| Script | `node --test scripts/*.test.mjs` | build, postbuild e controlli |
| E2E | Playwright | Chromium, Firefox, WebKit, Android e iPhone emulati |
| Accessibilità | axe dentro gli e2e | WCAG 2.2 AA in entrambi i temi |
| Prestazioni | Lighthouse CI | mobile, performance ≥ 0.95 |

Gli e2e partono dal sito buildato, su un server dedicato alla porta 4300 che si ferma se la porta è occupata. Saltano l'intro e spengono lo smooth scroll (`e2e/fixtures.ts`), e dopo ogni navigazione aspettano che non ci siano più effetti in attesa.

## Mentre si lavora

- Esegui solo il test toccato (un file, `--project=chromium`); `npm run verify` resta il controllo finale.
- Giudica ogni controllo dal suo exit code, non dall'output: in `a && b` un `a` che fallisce salta `b` senza dire nulla.
- Prima di cambiare un template, cerca negli e2e gli attributi e i testi che cambi.

## Lezioni dai test instabili

`CODING_STANDARDS.md` raccoglie le regole nate da fallimenti reali. Alcune:

- Un test su una finestra di tempo non deve dipendere da quanto è veloce Playwright: `locator.click()` aspetta la stabilità, circa mezzo secondo in WebKit in CI. Meglio `page.mouse.click` su una posizione misurata.
- Che un'animazione su canvas giri si verifica contando i disegni, non confrontando i pixel: WebKit in CI disegna la home a circa 4 frame al secondo.
- Una scadenza garantita dal CSS va garantita anche quando subentra GSAP, perché il suo lag smoothing rallenta l'orologio quando il main thread è occupato.
- Ogni fallimento arrivato in CI si chiude con la correzione della causa **e** una guardia automatica.
