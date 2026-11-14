# Lingue e tema

## Due build, una per lingua

L'inglese è la lingua sorgente dei template; l'italiano vive in `src/locale/messages.it.xlf`, e una traduzione mancante fa fallire il build.

- Le stringhe dell'interfaccia hanno `@@id` espliciti, così un cambio di testo non cambia l'identificativo.
- I contenuti lunghi vengono da `content.en.ts` e `content.it.ts`, scelti in base a `LOCALE_ID` tramite il token `CONTENT`.
- Dopo aver cambiato un template: `npm run i18n:extract`, poi le nuove unità si aggiungono a mano in `messages.it.xlf`.

Il selettore di lingua scrive il cookie `nf_lang`, che Netlify rispetta nel redirect su `/`. Il passaggio fa scendere una tenda a tutto schermo con il nome della nuova lingua: lo script inline in `src/index.html` fa partire la nuova pagina già coperta, così la tenda si alza dall'altra parte.

## Tema senza flash

- Uno script inline in `src/index.html` imposta `data-theme` prima della prima pittura, leggendo la preferenza salvata o quella del sistema.
- Dopo l'idratazione subentra `ThemeService`, con la logica in funzioni pure (`core/theme/theme.ts`).
- Tutti i colori sono variabili CSS in `src/styles/_tokens.scss`, perché il tema le cambia a runtime.

## Palette

Grigi, una famiglia di blu (`--accent` `#0058b8` nel tema chiaro), lavanda e pesca. Nessun verde. Le sezioni cambiano tono con delle bande (pastello, lavanda, inchiostro) che ridefiniscono `--fg`, `--link`, `--focus` e `--rule`: i contenuti si adattano da soli. Ogni combinazione è verificata AA.

Questo handbook usa la stessa palette: l'header è la banda inchiostro, come il footer del sito.
