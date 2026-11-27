---
title: Come ho architettato questo portfolio in Angular 22
description: Prerendering statico zoneless su Netlify, script dopo il primo frame, chunk lazy per GSAP e Three.js e Lighthouse CI che tiene la performance mobile a 95+.
date: 2026-11-12
---
Per un portfolio personale quasi tutti scelgono Astro o HTML statico; Angular viene dato per scontato come troppo pesante fuori dalle dashboard enterprise.

Ho costruito questo sito in Angular 22 per mettere alla prova quell’idea: prerendering statico, niente Zone.js, performance mobile a 95 o più su Lighthouse CI e accessibilità WCAG 2.2 AA.

## Prerendering statico e architettura zoneless

In produzione non è presente alcun processo Node.js attivo. Configurando `outputMode: "static"` in `angular.json`, il compilatore Angular genera l’intero albero delle rotte al momento della build.

In combinazione con `@angular/localize`, la pipeline produce due cartelle statiche autonome:

- `dist/portfolio/browser/en/` per la versione inglese
- `dist/portfolio/browser/it/` per la versione italiana

Netlify serve direttamente questi file statici dalla sua CDN globale. Un cookie `nf_lang`, impostato dal selettore di lingua nell’header, viene letto a livello di edge redirect in `netlify.toml` per indirizzare la root `/` alla lingua corretta.

Inoltre, l’applicazione funziona senza `zone.js`. L’architettura è basata esclusivamente su Angular Signals e sulla reattività nativa:

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

Su mobile, la metrica più delicata per l’esperienza utente è il Largest Contentful Paint (LCP), combinato con il Total Blocking Time (TBT). Nel portfolio, l’elemento LCP è il titolo principale dell’hero, quindi puro testo.

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

Questa separazione ha ridotto il First Contentful Paint da 1.9s a 1.2s su Lighthouse mobile. Chi apre la pagina la vede subito pronta e leggibile, mentre l’idratazione e l’event replay partono dopo il primo frame.

## Motion interattiva senza appesantire il bundle

Volevo un sito vivace: scorrimento fluido calibrato, effetti di parallasse, transizioni di testo e un moai isometrico voxel nell’angolo inferiore. Tuttavia, librerie come GSAP (con ScrollTrigger, SplitText e ScrollSmoother) o Three.js possono degradare i tempi di caricamento se incluse nel bundle iniziale.

La soluzione adottata si basa su un caricamento a livelli:

1. **Lazy chunk dedicati**: né GSAP né Three.js fanno parte dell’entry bundle.
2. **Caricamento sequenziale con `MOTION_LOADER`**: il token aspetta il primo frame, importa GSAP e i plugin uno alla volta, e `MotionHost` avvia ogni effetto in un proprio task `setTimeout` per evitare un unico blocco lungo sulla CPU.
3. **Preferenze utente prima di tutto**: con `prefers-reduced-motion: reduce` GSAP non viene nemmeno caricato. ScrollSmoother gira solo su `(hover: hover)` e `(pointer: fine)`, mentre i pin desktop richiedono almeno `1024px` con hover, lasciando ai dispositivi touch lo scorrimento nativo.

Tra le sezioni della home page, giunzioni a gradini disegnate con livelli di path SVG (`PixelDissolve`) si formano e si dissolvono in sincronia con la posizione di scroll tramite una variabile CSS `--p`:

```scss
.seam {
  position: absolute;
  inset-inline: calc(50% - 50vw);
  height: var(--space-6); // 48px: three rows of 16px cells
}
```

Aggiornare una sola variabile CSS muove le giunzioni senza innescare ricalcoli di layout.

## Automazione e verifica continua

Mantenere elevati standard prestazionali e di accessibilità richiede verifiche continuative. Per evitare regressioni, ogni modifica viene validata da una suite di controlli automatizzati prima dell’integrazione:

- `npm run lint`: regole severe di ESLint con `typescript-eslint` in modalità strictTypeChecked e `angular-eslint`, con zero warning tollerati.
- `npx ng test --no-watch`: suite di unit test con Vitest per i servizi core e le logiche di stato.
- `npm run lhci`: tre esecuzioni di Lighthouse CI su profili mobile per garantire un punteggio prestazionale minimo di 0.95.
- `npm run e2e`: test end-to-end con Playwright che includono verifiche automatiche axe per la conformità WCAG 2.2 AA sia in tema chiaro che in tema scuro.
- `npm run e2e:webkit`: esecuzione dei test per motori WebKit all’interno di un container Linux isolato.

Il prerendering statico e la reattività zoneless di Angular 22 reggono bene anche su un sito di contenuti, a patto di tenere la motion fuori dal bundle iniziale e far rispettare in CI le soglie di performance e accessibilità.
