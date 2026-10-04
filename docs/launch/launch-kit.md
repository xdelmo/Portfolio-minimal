# Kit di lancio — Portfolio v2

Quello che resta da fare per mettere online il nuovo sito. Tutto ciò che è qui richiede te: account Netlify, Google, LinkedIn, oppure un sì esplicito al merge.

## 1. Anteprima del branch `v2`

- [ ] Su Netlify: *Site configuration → Build & deploy → Branches and deploy contexts → Branch deploys → Let me add individual branches → `v2`*. Il primo push successivo crea `https://v2--<nome-sito>.netlify.app`; la produzione su `master` non cambia.
- [ ] Lancia `npm run verify:deploy -- https://v2--<nome-sito>.netlify.app`: ogni riga deve essere `ok`.
  - Se `/ with it-IT` porta a `/en/`, la condizione in `netlify.toml` va cambiata in `Language = ["it", "it-IT", "it-CH"]`.
  - Se il case study risponde con un redirect allo slash finale, il canonical (senza slash) punta a un redirect: va disattivato "Pretty URLs" in *Build & deploy → Post processing* oppure va cambiato il formato degli URL. Me lo dici e lo sistemo.
- [ ] Mandami l'URL dell'anteprima: ci faccio girare anche Lighthouse.

## 2. Verifica manuale WCAG 2.2 AA (spec §12)

Su `/en/`, `/it/` e un case study, in tema chiaro e scuro:

- [ ] Solo tastiera: Tab dall'inizio alla fine, "Vai al contenuto", pulsanti del moai e pausa del pixel field; il focus si vede sempre.
- [ ] VoiceOver su macOS (Cmd+F5) e su iPhone: titoli in ordine, immagini descritte, moai e pixel field ignorati.
- [ ] Zoom del browser al 200%: niente testo tagliato né scroll orizzontale.
- [ ] Text spacing (bookmarklet "Text spacing" di Steve Faulkner): niente testo coperto.
- [ ] Riduci movimento attivo (Impostazioni di sistema → Accessibilità → Schermo): immagini ferme, niente animazioni.

## 3. Telefoni veri (spec §13)

Un iPhone e un Android:

- [ ] scroll fino in fondo senza blocchi, anche passando sul moai;
- [ ] il moai ruota, i pulsanti funzionano; il pixel field si mette in pausa;
- [ ] tema e lingua cambiano e restano dopo il ricaricamento;
- [ ] email, LinkedIn, GitHub e i link dei progetti si aprono.

## 4. Lancio

- [ ] Mi dai il via libera al merge di `v2` su `master`. Apro la PR, aspetto la CI e faccio il merge; Netlify pubblica la produzione.
- [ ] Subito dopo: `npm run verify:deploy -- https://www.emanueledelmonte.it`.
- [ ] `curl -sI https://emanueledelmonte.it/` deve dare `301` verso `https://www.emanueledelmonte.it/`.

## 5. Fuori dal sito (spec §8 e §9)

- [ ] **Google Search Console**: aggiungi la proprietà di dominio `emanueledelmonte.it` (verifica DNS) e invia `https://www.emanueledelmonte.it/sitemap.xml`.
- [ ] **Bing Webmaster Tools**: importa il sito da Search Console e invia la stessa sitemap.
- [ ] **LinkedIn**, stessi dati del sito (nome, ruolo, città, link):
  - Titolo: `Frontend Engineer · Angular, Signals, RxJS · IPS S.p.A. · Latina`
  - Prima riga di "Informazioni": `Frontend Engineer a Latina: costruisco interfacce Angular che restano veloci anche quando i dati crescono. Progetti e case study su www.emanueledelmonte.it`
  - Sezione "In primo piano" e campo "Sito web": `https://www.emanueledelmonte.it`
- [ ] **README del profilo GitHub** (repo `xdelmo/xdelmo`), bozza:

  ```markdown
  # Emanuele Del Monte

  Frontend Engineer at IPS S.p.A., based in Latina, Italy. I build Angular interfaces
  that stay fast when the data gets big: Signals, RxJS, server-side filtering, large tables.

  - Portfolio and case studies: https://www.emanueledelmonte.it
  - Featured: [ApexFlow](https://www.emanueledelmonte.it/en/work/apexflow), a CRM dashboard with Angular and Spring Boot
  - LinkedIn: https://www.linkedin.com/in/emanueledelmonte/
  ```

- [ ] Nel README di ogni repo pubblica citata nei case study: una riga con il link al case study sul sito.

## 6. Dopo qualche settimana (spec §9)

- [ ] Chiedi a ChatGPT, Perplexity e Claude, con la ricerca web attiva: "Chi è Emanuele Del Monte, frontend engineer?". Annota cosa sanno e da dove lo prendono (sito, LinkedIn, GitHub).
- [ ] In Search Console controlla che le 10 pagine siano indicizzate e che le versioni IT ed EN siano riconosciute come alternative.

## 7. Domande ancora aperte

- [ ] **Lingue** nel blocco "At a glance": quali e a che livello (per esempio "Italiano madrelingua, inglese B2")?
- [ ] **Titolo ufficiale**: `Frontend Engineer` (ora sul sito) oppure `Software Engineer, Frontend Specialist` come da contratto? Deve essere uguale su sito, LinkedIn e GitHub.
- [ ] **Bot Telegram**: nel file `.env.example` di una repo pubblica ci sono due id Telegram che sembrano reali. Se lo sono, vanno sostituiti con valori finti.
