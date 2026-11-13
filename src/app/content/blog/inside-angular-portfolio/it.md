---
title: Come ho architettato questo portfolio in Angular 22
description: Prerendering statico zoneless, zero runtime server su Netlify, motion differita con GSAP e shader su canvas, con Lighthouse CI che tiene la performance mobile a 95 o più.
date: 2026-11-12
---
Quando si sceglie lo stack per un portfolio personale nel 2026, la maggior parte degli sviluppatori si orienta su Astro, Next.js o semplice HTML statico. Angular viene spesso etichettato come uno strumento pensato solo per grandi applicazioni enterprise, troppo pesante per un sito vetrina.

Ho costruito questo portfolio per verificare il contrario: spingere l'architettura di Angular 22 verso un modello interamente statico, reattivo con i Signals, senza Zone.js, con la performance mobile a 95 o più su Lighthouse CI, e con animazioni fluide e accessibilità WCAG 2.2 AA.

## Prerendering statico e architettura zoneless

In produzione non è presente alcun processo Node.js attivo. Configurando `outputMode: "static"` in `angular.json`, il compilatore Angular genera l'intero albero delle rotte al momento della build.

In combinazione con `@angular/localize`, la pipeline produce due cartelle statiche autonome:

- `dist/portfolio/browser/en/` per la versione inglese
- `dist/portfolio/browser/it/` per la versione italiana

Netlify serve direttamente questi file statici dalla sua CDN globale. Un cookie `nf_lang`, impostato dal selettore di lingua nell'header, viene letto a livello di edge redirect in `netlify.toml` per indirizzare la root `/` alla lingua corretta.

Inoltre, l'applicazione funziona senza `zone.js`. L'architettura è basata esclusivamente su Angular Signals e sulla reattività nativa:

```ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withComponentInputBinding(),
      withViewTransitions({ skipInitialTransition: true }),
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }),
      withChunkReload(),
    ),
    provideClientHydration(withEventReplay(), withI18nSupport()),
    provideContent(),
  ],
};
```

Senza Zone.js, il change detection viene eseguito solo quando i segnali cambiano effettivamente valore, eliminando il monkey patching degli eventi del browser e riducendo il payload JavaScript iniziale.

## Caricamento del primo frame prima degli script

Su mobile, la metrica più delicata per l'esperienza utente è il Largest Contentful Paint (LCP), combinato con il Total Blocking Time (TBT). Nel portfolio, l'elemento LCP è il titolo principale dell'hero, quindi puro testo.

Di default, Angular inietta i tag `<script type="module">` nel documento HTML. Il browser inizia a scaricarli ed eseguirli immediatamente, competendo con il rendering iniziale dei font e del testo.

Per massimizzare le prestazioni, ho implementato uno script di post-build (`scripts/after-paint.mjs`) che sostituisce i tag di script eager con un loader inline eseguito solo dopo il primo frame di animazione:

```html
<script>
  requestAnimationFrame(() => {
    setTimeout(() => {
      // Caricamento asincrono dei moduli di bootstrap Angular
    }, 0);
  });
</script>
```

Questa separazione ha ridotto il First Contentful Paint da 1.9s a 1.2s su Lighthouse mobile. Il visitatore visualizza immediatamente la pagina tipograficamente completa e stilizzata, mentre l'idratazione e i gestori di eventi si collegano in background senza bloccare il thread principale.

## Motion interattiva senza appesantire il bundle

Volevo un sito vivace: scorrimento fluido calibrato, effetti di parallasse, transizioni di testo e un moai isometrico voxel nell'angolo inferiore. Tuttavia, librerie come GSAP (con ScrollTrigger, SplitText e ScrollSmoother) o Three.js possono degradare i tempi di caricamento se incluse nel bundle iniziale.

La soluzione adottata si basa su un caricamento a livelli:

1. **Lazy chunk dedicati**: né GSAP né Three.js fanno parte dell'entry bundle.
2. **MOTION_LOADER sequenziale**: il servizio carica GSAP e i suoi plugin uno alla volta in microtask separati. Suddividere l'inizializzazione evita blocchi prolungati della CPU durante la fase di avvio.
3. **Rispetto delle preferenze utente**: se il sistema rileva `prefers-reduced-motion: reduce` o uno schermo touch (`pointer: coarse`), ScrollSmoother e gli effetti di parallasse vengono disabilitati all'origine, lasciando spazio allo scorrimento nativo del sistema operativo.

Tra le sezioni della home page, giunzioni a gradini disegnate su canvas (`PixelDissolve`) si formano e si dissolvono in sincronia con la posizione di scroll tramite una variabile CSS `--p`:

```scss
app-pixel-dissolve.seam {
  display: block;
  width: 100%;
  height: 24px;
}
```

I blocchi visivi comunicano solidità e ritmo senza rallentare la navigazione.

## Automazione e verifica continua

Mantenere elevati standard prestazionali e di accessibilità richiede verifiche continuative. Per evitare regressioni, ogni modifica viene validata da una suite di controlli automatizzati prima dell'integrazione:

- `npm run lint`: regole severe di ESLint con `typescript-eslint` in modalità strictTypeChecked e `angular-eslint`, con zero warning tollerati.
- `npx ng test --no-watch`: suite di unit test con Vitest per i servizi core e le logiche di stato.
- `npm run lhci`: tre esecuzioni di Lighthouse CI su profili mobile per garantire un punteggio prestazionale minimo di 0.95.
- `npm run e2e`: test end-to-end con Playwright che includono verifiche automatiche axe per la conformità WCAG 2.2 AA sia in tema chiaro che in tema scuro.
- `npm run e2e:webkit`: esecuzione dei test per motori WebKit all'interno di un container Linux isolato.

## Conclusione

Adottare Angular per un portfolio personale non è stato un ripiego o una forzatura, ma un'opportunità per dimostrare il potenziale delle funzionalità moderne del framework. 

Grazie ai segnali zoneless, al prerendering statico e a una gestione disciplinata del caricamento degli asset, è possibile realizzare un'esperienza veloce, accessibile e visivamente ricca.
