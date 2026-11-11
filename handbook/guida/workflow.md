# Workflow e CI

## Branch

```mermaid
gitGraph
  commit id: "master (live)"
  branch devel
  commit id: "lavoro raccolto"
  branch feat/123-topic
  commit id: "modifica"
  checkout devel
  merge feat/123-topic
  checkout master
  merge devel id: "release"
```

- Ogni problema diventa prima una issue; il branch ne porta il numero (`fix/<n>-topic`).
- Ogni modifica ha il suo branch da `devel`, con un prefisso che dice cos'è: `feat/`, `fix/`, `docs/`, `chore/`, `ci/`, `test/`, `refactor/`, `perf/`, `style/`, `build/`. Un hook `pre-push` e la CI lo verificano (`scripts/branch-name.mjs`).
- Mai commit diretti su `devel` o `master`.
- `devel` raccoglie il lavoro; una pull request `devel` → `master` lo porta online, con un merge commit per tenere la storia.

## Dalla modifica al merge

`npm run ship -- --title "…" --body-file <file>` fa push, apre la pull request verso `devel`, aspetta i controlli di GitHub Actions e fa il merge con rebase solo se passano. Una CI rossa si corregge sul branch, non si fa mai il merge.

## La CI

| Job | Cosa fa |
|---|---|
| Lint & Unit Tests | nome del branch, lint, Vitest, test degli script |
| Build | il build completo, pubblicato come artifact per i job successivi |
| Lighthouse CI | performance mobile sul build |
| E2E | Chromium, Firefox, Android, WebKit, iPhone, divisi in shard |
| E2E Changed Specs | ripete 5 volte le spec cambiate dalla pull request, per scovare i test instabili |
| Docs | controllo dei dati sensibili e `mkdocs build --strict`; da `master` pubblica questo handbook su GitHub Pages |

Per un fallimento in CI: `gh run download <run-id>` scarica i `test-results`; si leggono i passi e le durate dal `trace.zip` prima di cambiare qualcosa, e si corregge la causa invece di rilanciare finché diventa verde.

## Release

Quando `devel` è pronto, la pull request verso `master` va online dopo un sì esplicito. Le issue risolte su `devel` si chiudono con quel merge.
