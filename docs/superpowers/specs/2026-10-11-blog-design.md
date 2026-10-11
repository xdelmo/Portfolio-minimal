# Blog — design (issue #1)

Stato: approvato dall'utente a sezioni il 2026-10-11 (file Markdown, sempre bilingue, voce "Blog" nel menu, script di build), poi "procedi in autonomia".

## Obiettivo

Una sezione blog che parte da tre post tecnici pubblicati su LinkedIn (Signals nel modulo di autenticazione di ApexFlow, `TablePaginationState`, Spring Boot contro NestJS) e li allarga in articoli con il codice vero. Il blog continuerà: aggiungere un articolo vuol dire aggiungere due file.

## Contenuto

- `src/app/content/blog/<slug>/{en,it}.md`: lo slug è il nome della cartella, uguale nelle due lingue.
- Frontmatter piatto (solo stringhe):
  - `title`, `description`, `date` (AAAA-MM-GG, pubblicazione sul sito) obbligatori;
  - `updated`, `project` (slug di un case study), `linkedin` (URL del post originale) facoltativi.
- `date`, `updated` e `project` devono coincidere tra le due lingue; `project` deve esistere tra i progetti.
- Gli articoli sono scritti da Claude a partire dai post e dal codice di `dashboard-tesi` e `backend-tesi`, in prima persona: l'utente li rivede prima del passaggio a `master` (launch kit).

## Build

- `scripts/blog.mjs` gira prima di build, start, verify e `npm install`, come `public-repos.mjs`:
  - legge le cartelle;
  - ferma il build su lingua mancante, campo mancante, data non valida, date o progetto diversi tra le lingue, progetto sconosciuto;
  - converte il Markdown con `marked` (dipendenza di sviluppo, niente JavaScript in più per chi legge);
  - scrive `src/app/content/blog.generated.ts` (escluso da git): per lingua, gli articoli dal più recente, con HTML, Markdown sorgente, data formattata (`Intl.DateTimeFormat`, `dateStyle: long`) e minuti di lettura (parole / 220, arrotondato in su).
- Nessun colore di sintassi: i blocchi di codice sono monocromi, in inchiostro su superficie (il sito è testo prima di tutto, e il sanitizer di Angular toglierebbe gli `style` di un evidenziatore).
- I `<pre>` hanno `tabindex="0"`: scorrono in orizzontale e la tastiera deve raggiungerli (axe `scrollable-region-focusable`).

## Pagine

- `/blog`: titolo, una riga di introduzione, la lista degli articoli (titolo come link, data, minuti, descrizione).
- `/blog/:slug`: titolo, data e minuti, l'HTML dell'articolo, il link al case study collegato, il link "Tutti gli articoli". Slug sconosciuto: pagina non trovata con `noindex`, come i case study.
- Il case study con articoli collegati mostra "Ne ho scritto" con i loro link, prima del progetto successivo.
- Voce "Blog" nel menu desktop e in quello del telefono, verso `/blog`.
- Token `BLOG` scelto da `LOCALE_ID`, come `CONTENT`.
- Prerender: `blog/:slug` in `app.routes.server.ts` con `getPrerenderParams`.

## SEO e GEO

- Titolo `<titolo> — Emanuele Del Monte`, description dal frontmatter, canonical e hreflang come le altre pagine.
- JSON-LD: `Blog` sull'indice, `BlogPosting` (headline, datePublished, dateModified, author, inLanguage) sull'articolo.
- Open Graph: una card per articolo e una per l'indice (`npm run og:images`).
- `geo-files.mjs`: Markdown dell'indice e di ogni articolo, articoli elencati in `llms.txt`.
- Sitemap e `_redirects` li ricava già `postbuild.mjs` dalle pagine prerenderizzate.

## Test

- `scripts/blog.test.mjs`: frontmatter, ogni errore che ferma il build, ordine, `tabindex` sui `<pre>`, minuti.
- `seo.spec.ts`: JSON-LD di indice e articolo.
- `e2e/blog.spec.ts`: dal menu all'indice, articoli dal più recente, articolo con data e codice raggiungibile da tastiera, link al case study e ritorno, cambio lingua sullo stesso slug, Markdown alternativo, slug sconosciuto.
- `a11y.spec.ts`: indice e un articolo con axe nei due temi.

## Fuori dalla v1

Commenti, RSS, tag, ricerca, evidenziazione della sintassi.
