# Kit di lancio — Portfolio v2

Quello che resta da fare per mettere online il nuovo sito. Tutto ciò che è qui richiede te: account Netlify, Google, LinkedIn, oppure un sì esplicito al merge.

## 1. Anteprima del branch `v2`

- [x] Branch deploy di `v2` attivo: `https://v2--emanueledelmonte.netlify.app`.
- [x] Rimosso dalla UI di Netlify il plugin `@netlify/plugin-gatsby`, che faceva fallire ogni deploy Angular.
- [x] I case study rispondevano con un 301 verso l'URL con lo slash finale: ora `scripts/postbuild.mjs` genera `_redirects` con un rewrite 200 per ogni pagina, senza toccare le impostazioni Netlify.
- [x] La cache edge di Netlify a volte rispondeva a una richiesta con il cookie `nf_lang` usando il redirect salvato senza cookie: `netlify.toml` imposta `Netlify-Vary` e `Cache-Control: no-store` su `/`.
- [x] `npm run verify:deploy -- https://v2--emanueledelmonte.netlify.app`: tutte le righe `ok` (tre run di fila, 2026-10-04).

## 2. Verifica manuale WCAG 2.2 AA (spec §12)

Su `/en/`, `/it/` e un case study, in tema chiaro e scuro:

- [ ] Solo tastiera: Tab dall'inizio alla fine, "Vai al contenuto", il pulsante di pausa delle animazioni nell'header, il titolo dei Contatti (link email), "Back to top" e "Press start" nel footer; il focus si vede sempre.
- [ ] VoiceOver su macOS (Cmd+F5) e su iPhone: titoli in ordine, immagini descritte, moai e pixel field ignorati.
- [ ] Zoom del browser al 200%: niente testo tagliato né scroll orizzontale.
- [ ] Text spacing (bookmarklet "Text spacing" di Steve Faulkner): niente testo coperto.
- [ ] Riduci movimento attivo (Impostazioni di sistema → Accessibilità → Schermo): immagini ferme, niente animazioni.

## 3. Telefoni veri (spec §13)

Un iPhone e un Android:

- [ ] scroll fino in fondo senza blocchi, anche passando sul moai;
- [ ] il moai gira con uno swipe laterale e fa la bolla di gomma al doppio tocco; il pulsante di pausa nell'header ferma tutte le animazioni;
- [ ] tema e lingua cambiano e restano dopo il ricaricamento;
- [ ] email, LinkedIn, GitHub e i link dei progetti si aprono.

## 4. Lancio

- [x] **Link a GitHub automatici (issue #81)** — fatto il 2026-10-10: build hook creato e salvato come secret `NETLIFY_BUILD_HOOK`; il workflow parte da solo dopo il merge su `master`: il sito linka solo le repo che GitHub mostra ai visitatori, decise a ogni build da `scripts/public-repos.mjs`. Perché un link compaia da solo quando rendi pubblica una repo (o sparisca quando torna privata), serve un deploy: lo lancia ogni giorno `.github/workflows/repos.yml` (attivo dopo il merge su `master`). Due passi tuoi:
  1. Netlify → Site configuration → Build & deploy → Build hooks → *Add build hook*, nome `public-repos`, branch `master`; copia l'URL.
  2. GitHub → repo → Settings → Secrets and variables → Actions → *New repository secret*: nome `NETLIFY_BUILD_HOOK`, valore l'URL del passo 1.
  Senza il secret il workflow fallisce (e GitHub ti avvisa) il giorno in cui le repo pubbliche cambiano.
- [ ] **Prova generale su `devel`** (creato da `master` il 2026-10-08): `v2` entra prima in `devel` con una PR e un merge commit, così i problemi del lancio escono lì e non su `master`. Cosa ha mostrato finora:
  - nessun conflitto: `master` è il commit da cui parte `v2`, il merge aggiunge solo i 188 commit sopra;
  - merge commit, non squash: lo squash schiaccerebbe tutta la storia di `v2` in un commit;
  - il controllo dei nomi dei branch e la CI conoscevano solo `v2` e `master`: aggiunto `devel` (per `master` erano già a posto);
  - `master` non ha protezione del branch su GitHub: niente impedisce un merge con la CI rossa, restano l'hook locale e la regola di aspettare la CI;
  - `master` oggi non ha `netlify.toml`: la produzione legge build command, cartella e Node 24 da quello di `v2` solo dopo il merge. Prima del merge vero, nella UI di Netlify controlla che non restino il build command di Gatsby né `@netlify/plugin-gatsby`;
  - `v2` è entrato in `devel` il 2026-10-08 (PR #73, merge commit, CI verde). Il deploy preview della PR (`https://deploy-preview-73--emanueledelmonte.netlify.app`) passa tutte le 18 righe di `npm run verify:deploy`: build, redirect di lingua, 404 per lingua, sitemap, robots, llms.txt e immagini OG funzionano sulla build che andrà online;
  - Netlify non pubblica `devel`: `https://devel--emanueledelmonte.netlify.app` dà 404 ovunque, perché i branch deploy sono attivi solo per `v2`. Se vuoi un indirizzo fisso di `devel`, aggiungi `devel` in Netlify → Site configuration → Build & deploy → Branches and deploy contexts → Branch deploys; altrimenti basta il deploy preview della PR;
  - il vecchio `/privacy` di Gatsby andava su `/it/`: ora va su `/it/privacy/` (2026-10-08), e `verify:deploy` lo controlla.
- [ ] Mi dai il via libera al merge di `v2` su `master`. Apro la PR, aspetto la CI e faccio il merge; Netlify pubblica la produzione. Il sito Gatsby su `master` non ha più il plugin Gatsby: se serve ribuildarlo prima del merge, è un sito statico e builda comunque.
- [ ] Subito dopo: `npm run verify:deploy -- https://www.emanueledelmonte.it`.
- [ ] `curl -sI https://emanueledelmonte.it/` deve dare `301` verso `https://www.emanueledelmonte.it/`.

## 5. Fuori dal sito (spec §8 e §9)

- [ ] **Google Search Console**: aggiungi la proprietà di dominio `emanueledelmonte.it` (verifica DNS) e invia `https://www.emanueledelmonte.it/sitemap.xml`.
- [ ] **Bing Webmaster Tools**: importa il sito da Search Console e invia la stessa sitemap.
- [ ] **LinkedIn**, stessi dati del sito (nome, ruolo, città, link):
  - Titolo: `Frontend Engineer · Angular, Signals, RxJS · IPS S.p.A. · Latina`
  - Prima riga di "Informazioni": `Frontend Engineer a Latina: interfacce Angular veloci anche con molti dati. Progetti e case study su www.emanueledelmonte.it`
  - Sezione "In primo piano" e campo "Sito web": `https://www.emanueledelmonte.it`
- [x] **README del profilo GitHub** (repo `xdelmo/xdelmo`), aggiornato il 2026-10-06 con gli stessi dati del sito. Linka solo cose raggiungibili oggi (sito, demo, repo pubbliche): `dashboard-tesi`, `ice-friends-breaker`, i bot e le side quest sono private. Dopo il merge su `master`: aggiungere i link ai case study (`/en/work/<slug>`) e, quando le repo diventano pubbliche, i link al codice.
- [ ] Nel README di ogni repo pubblica citata nei case study: una riga con il link al case study sul sito.

## 6. Dopo qualche settimana (spec §9)

- [ ] Chiedi a ChatGPT, Perplexity e Claude, con la ricerca web attiva: "Chi è Emanuele Del Monte, frontend engineer?". Annota cosa sanno e da dove lo prendono (sito, LinkedIn, GitHub).
- [ ] In Search Console controlla che le 10 pagine siano indicizzate e che le versioni IT ed EN siano riconosciute come alternative.

## 7. Domande ancora aperte

- [x] **Lingue** nel blocco "At a glance": italiano madrelingua, inglese professionale, come su LinkedIn.
- [x] **Titolo ufficiale**: deciso il 2026-10-07, `Frontend Engineer | Angular Developer` come titolo del profilo LinkedIn (le ricerche dei recruiter passano da "Frontend Engineer" e "Angular"); il sito e il README di GitHub dicono già `Frontend Engineer`.
- [ ] **Repo ancora private** citate nei progetti e nelle side quest: i link portano già lì; rendile pubbliche dopo una scansione dei segreti (vedi la riga sotto).
- [x] **Issue #3** (Privacy): chiusa il 2026-10-07, la pagina `/privacy` copre tutto e l'imprint non serve per un sito personale. Se aggiungi statistiche, dimmelo: la pagina va aggiornata prima di attivarle.
- [x] **Esperienza**: allineata a LinkedIn il 2026-10-06 (agenzia 2022 – 2024, punti e tag di ogni lavoro, certificati). "BIP" accanto a Joinrs tolto (non è su LinkedIn); la vittoria del quiz Agile confermata dall'utente.
- [x] **Bot Telegram**: controllato il 2026-10-07, nei `.env.example` di `auto-scadenze-bot`, `hoenn-binder` e `presenz-lazy-bot` (e nella loro history) ci sono solo segnaposto: gli id sono `123456789`, token e password non hanno la forma di quelli veri.

## 8. Pulizia che richiede te

- [x] Chiudi la issue [#2](https://github.com/xdelmo/Portfolio-minimal/issues/2) (easter egg, fatto nel piano 10): chiusa il 2026-10-07.
- [ ] Branch remoti già mergiati, rimasti su GitHub (facoltativo): `git push origin --delete chore/ci-gate chore/limit-test-cpu fix/about-first-person fix/gum-from-mouth fix/lhci-case-study-url fix/moai-bubble-timer fix/moai-gum-and-exit robustness-skills worktree-pixel-field-fade`. `archive/gatsby-master` e il tag `gatsby-final` restano: sono la copia del sito Gatsby.
- [ ] Aggiornamenti maggiori in attesa, da fare su un branch con `npm run verify`: TypeScript 7 (quando Angular lo supporta) e `@types/node` allineato a Node 24.
