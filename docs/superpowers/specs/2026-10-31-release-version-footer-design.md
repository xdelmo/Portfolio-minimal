# Versione release nel footer del sito: design

**Stato:** approvato dall'autore il 2026-10-31. Issue #291.

## Intento

Esporre la versione di rilascio dell'applicazione nel footer del sito (es. `v2.1.0`), in modo che visitatori e autore possano verificare a colpo d'occhio quale build del portfolio è attualmente servita in produzione.

## Obiettivi

- Mostrare la versione della release accanto al copyright nel footer: `© <anno> Emanuele Del Monte · v<versione>`.
- Mantenere la versione come testo statico semplice (senza link a GitHub), coerente con lo stile minimal del footer.
- Sincronizzare deterministicamente il numero di versione a partire da `package.json` durante il comando `npm run generate`.
- Prevenire discrepanze di build con test unitari e verifiche E2E dedicate.

## Non obiettivi

- Nessun link interattivo esterno verso le GitHub Releases (richiesta esplicita dell'utente: testo statico).
- Nessun fetching runtime asincrono via API di GitHub o endpoint esterni.
- Nessuna visualizzazione del commit SHA o timestamp di build.

## Architettura e Implementazione

1. **Source of Truth (`package.json`)**:
   - `package.json` definisce `"version": "2.1.0"`.
   - Ad ogni nuova release, il bump di versione avviene aggiornando questo campo.

2. **Script Generatore (`scripts/version.mjs`)**:
   - Eseguito durante `npm run generate`.
   - Valida la presenza di una stringa di versione semver valida in `package.json`.
   - Genera il file `src/app/core/version.generated.ts` esportando la costante `APP_VERSION`.
   - `src/app/core/version.generated.ts` è tracciato in `.gitignore`.

3. **Componente Footer (`src/app/layout/site-footer.ts`)**:
   - Importa `APP_VERSION` da `../core/version.generated`.
   - Renderizza il testo del copyright con l'interpunto:
     ```html
     <p>© {{ year }} {{ content.person.name }} · v{{ version }}</p>
     ```

4. **Test e Validazione**:
   - `scripts/version.test.mjs`: suite con `node:test` per validare estrazione e formattazione TypeScript.
   - `src/app/layout/site-footer.spec.ts`: test Angular con Vitest per verificare la presenza di anno, nome e versione `APP_VERSION`.
   - `e2e/contact.spec.ts`: asserzione Playwright sul testo del footer sincronizzata con la versione di `package.json`.
