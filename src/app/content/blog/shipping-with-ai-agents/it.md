---
title: Pubblicare un portfolio con gli agenti AI e una CI che decide
description: Quasi tutti i commit di questo sito li scrivono agenti AI senza review umana, protetti da issue obbligatorie, controlli sui branch e una CI che decide.
date: 2026-11-21
---
Quasi tutti i commit di questo sito li scrivono agenti AI. Io descrivo un problema, un agente apre un’issue, scrive la modifica, e la pull request si mergia da sola quando la CI passa. Non rivedo ogni pull request.

Funziona solo perché è il repository a decidere cosa vuol dire “finito”. Un agente può essere sicuro di sé e sbagliare, quindi nessun passaggio si fida di lui. I controlli li fa il processo.

## Ogni modifica parte da un’issue

Ogni problema diventa un’issue su GitHub prima che qualcuno lo indaghi. Il branch porta il numero dell’issue e un prefisso che dice di che tipo di modifica si tratta: `fix/599-accent-contrast` o `feat/1-blog`. Uno script, `scripts/branch-name.mjs`, impone prefisso e formato dello slug nell’hook `pre-push` e di nuovo in CI, così un branch creato da un tool per i worktree viene rinominato prima di lasciare la macchina.

L’hook rifiuta anche i push diretti su `devel` e `master`. Tutto passa da una pull request.

## Un solo comando per pubblicare

`npm run ship` lancia `scripts/ship.sh`: fa il push del branch, apre la pull request verso `devel`, aspetta i controlli di GitHub Actions e mergia con un merge commit solo quando passano. Un ruleset sui due branch protetti richiede un solo job, `CI ok`, che diventa verde solo quando tutti gli altri sono passati o sono stati saltati.

Il controllo completo gira in CI, non sul portatile: lint con zero warning, test unitari, test degli script, la build statica delle due lingue e i test end to end di Playwright con i controlli di accessibilità di axe in entrambi i temi. Le spec toccate dalla pull request girano altre cinque volte, per scoprire i test instabili prima che entrino.

Una CI rossa si sistema sul branch. Non si mergia mai “per poi sistemare”.

## I docs viaggiano con la modifica

Un agente dimentica tutto tra una sessione e l’altra. Quello che ha imparato deve finire in un file che la sessione successiva legge, quindi i docs fanno parte della modifica. Un nuovo comando va in `CLAUDE.md`, una regola visiva nella guida di stile, una modifica alla spec nel suo registro delle modifiche.

`ship.sh` lo impone: se il codice è cambiato senza toccare nessun doc, si ferma. Per saltare il controllo serve un flag esplicito, cioè una decisione invece di una dimenticanza.

## I fallimenti diventano regole

Quando qualcosa si rompe in CI e nessun controllo automatico può impedirlo, la correzione arriva con una regola in `CODING_STANDARDS.md`. Gli agenti leggono quel file prima di scrivere test o codice di animazione.

L’esempio più chiaro è WebKit. Quasi tutte le CI rosse erano errori su Safari e iPhone che nessuno aveva visto in locale, perché WebKit non gira in modo nativo sul mio Mac. Ora `npm run e2e:webkit` lancia gli stessi test nell’immagine Linux di Playwright usata in CI, dentro un container, e fa parte del `verify` locale. Un’altra regola è nata da un portatile senza ventola che andava in stop a metà dei test: i run lunghi si lanciano con `caffeinate`.

Ogni regola è piccola. Insieme fanno sì che lo stesso errore arrivi di rado in CI una seconda volta.

## Cosa resta umano

Alcune decisioni restano mie. `devel` raccoglie il lavoro, e solo io dico quando va online: una grande pull request da `devel` a `master`, mergiata dopo un sì esplicito. La direzione del design, i testi che parlano per me e tutto ciò che tocca la privacy restano a me.

Gli agenti sono veloci nelle parti che hanno una risposta giusta chiara. È il repository il motivo per cui posso lasciarli lavorare da soli.
