# Contenuti, blog e SEO

## Un solo sorgente

Pagine, copie Markdown, `llms.txt` e immagini Open Graph nascono dagli stessi file di contenuto (`src/app/content/content.{en,it}.ts`). Cambiare un titolo vuol dire cambiarlo in un posto, poi rigenerare le immagini Open Graph con `npm run og:images` (il build fallisce se una pagina punta a un'immagine che non esiste).

## Blog

Ogni post è `src/app/content/blog/<slug>/{en,it}.md` con un frontmatter piatto (`title`, `description`, `date`, opzionali `updated`, `project`, `linkedin`). `scripts/blog.mjs` li trasforma nel modulo generato `blog.generated.ts`, letto tramite il token `BLOG`, e ferma il build se a un post manca una lingua o un campo.

## Link ai repository

I file di contenuto tengono gli URL di tutti i repository, ma il sito mostra solo quelli che un visitatore può aprire:

1. `scripts/public-repos.mjs` chiede a GitHub quali sono pubblici e scrive un modulo generato;
2. `onlyPublic()` toglie gli altri da `CONTENT` e da `llms.txt`;
3. il build pubblica la lista come `/repos.json`;
4. un workflow giornaliero la confronta con GitHub e, se cambia, avvia un build su Netlify.

Quali repository sono pubblici non è mai scritto a mano nel codice.

## SEO e agenti

- un grafo JSON-LD per pagina;
- `sitemap.xml` con hreflang, costruita dai tag canonical e hreflang delle pagine prerenderizzate;
- `llms.txt` e una copia Markdown di ogni pagina, per gli agenti AI;
- un'immagine Open Graph per pagina e per lingua.
