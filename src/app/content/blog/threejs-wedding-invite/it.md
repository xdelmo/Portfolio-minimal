---
title: Una busta di nozze 3D che smette di usare la GPU
description: Come ho costruito una busta di pizzo procedurale in Three.js che renderizza su richiesta, libera il contesto WebGL appena si apre e genera HTML, manifest, service worker e test WCAG AA da un’unica configurazione TypeScript.
date: 2026-11-26
project: wedding-3d-invite
---
Due amici volevano ricostruire il loro invito di nozze di carta—raso avorio, pizzo, perle e sigillo di ceralacca bordeaux—per il telefono che gli ospiti hanno già in mano. Quando un link si apre da WhatsApp sotto rete mobile non c’è pazienza per modelli pesanti, e un loop a 60 fps acceso dietro undici slide scalderebbe il telefono per niente.

Quattro scelte hanno tenuto l’invito leggero: geometria procedurale senza file 3D esterni, rendering su richiesta che libera WebGL appena la busta si apre, un’unica configurazione tipizzata che guida tutta la build e test unitari che controllano il contrasto WCAG AA su ogni palette.

## Pizzo e ceralacca procedurali, zero file 3D

La busta non carica nessun modello GLTF né immagini per le texture. Ognuno dei quattro lembi è una `ExtrudeGeometry` costruita da due curve di Bézier quadratiche con bordo smerlato, montata in un `THREE.Group` posizionato sulla cerniera esterna così da ribaltarsi dai bordi dello schermo come una busta vera.

Il pizzo viene disegnato su un `<canvas>` 2D fuori schermo come mappa di altezza: rete di tulle esagonale, petali a punto tela, foglie, occhielli e bordi a festoni. Una sola funzione, `bakeSurface()`, trasforma quell’altezza in tre mappe fisiche in un unico passaggio: colore diffuso con occlusione ambientale ricavata da una sfocatura bilineare per riduzione e ingrandimento (che funziona bene anche su Safari iOS), una `normalMap` in spazio tangente e una `roughnessMap`.

Le perle lungo gli smerli e sul raso usano una sola `THREE.InstancedMesh` per lembo (`MeshPhysicalMaterial` con `clearcoat`, `iridescence` e `sheen`), illuminate da `RoomEnvironment` tramite `PMREMGenerator`. Il sigillo di ceralacca è una `LatheGeometry` a 128 segmenti il cui bordo esterno è mosso da tre armoniche sinusoidali per sembrare colato a mano. Fare la media delle normali tra prima e ultima colonna elimina la riga di giunzione del tornio, e il monogramma viene ricalcolato appena `document.fonts.load('132px "Great Vibes"')` carica il font corsivo.

## Renderizzare solo quando qualcosa si muove, poi liberare WebGL

La maggior parte degli esempi Three.js avvia un `requestAnimationFrame` al mount e non lo ferma mai. Qui, finché la busta resta chiusa, non gira nessun loop. `initRenderer()` disegna un solo fotogramma; il canvas ridisegna solo al resize, all’arrivo del font del sigillo o quando termina lo snapshot differito della cornice interna.

`EnvelopeCanvas` carica `EnvelopeScene` con un `import()` dinamico. Chi torna sull’invito—o lo apre con `?opened=true`—non scarica nemmeno il chunk di Three.js. Se la rete cade durante il download del chunk, l’overlay si chiude da solo e mostra subito l’invito invece di bloccarsi sul caricamento.

Il tocco avvia `open()`: una sequenza di 1.800 ms ribalta prima il lembo superiore (che porta con sé il sigillo), poi l’inferiore e infine i due laterali. Quando `progress` arriva a `1`, il loop si ferma, il canvas si smonta e libera ogni risorsa GPU:

```ts
const loop = (currentTime: number) => {
  const elapsed = currentTime - this.animationStartTime;
  const progress = Math.min(1.0, elapsed / this.animationDuration);

  this.updateAnimation(progress);
  this.render();

  if (progress < 1.0) {
    this.animationFrameId = requestAnimationFrame(loop);
  } else {
    this.stopLoop();
  }
};
```

La pulizia azzera anche i flag WebGL `UNPACK_FLIP_Y_WEBGL` e `UNPACK_PREMULTIPLY_ALPHA_WEBGL` prima di chiamare `renderer.dispose()`. Senza quell’azzeramento, un remount di React StrictMode sullo stesso contesto canvas finisce in `INVALID_OPERATION` alla creazione delle nuove texture.

Altri due accorgimenti tengono ferma la GPU:

- Con `prefers-reduced-motion: reduce`, il tocco salta i 1.800 ms di animazione e apre subito l’invito.
- Anche la cornice in pizzo 3D dietro la copertina (`LaceFrameScene`) è statica: nessun loop, renderizza solo alla creazione e al resize. Per l’interno della busta, `LaceFrameScene.snapshot()` disegna un fotogramma su un canvas 2D e chiama subito `forceContextLoss()`, così non resta aperto un secondo contesto WebGL.

## Una configurazione tipizzata per HTML, PWA e audio offline

L’invito vero dei miei amici resta privato; la demo pubblica usa nomi di esempio. Entrambi escono dallo stesso repository impostando `VITE_COUPLE`, che punta l’alias `@couple` a `couples/<slug>/config.ts`.

In `vite.config.ts`, `runnerImport` legge direttamente quel file TypeScript e lo passa al plugin `couplePlugin`. Da lì la build genera `<title>`, tag Open Graph, JSON-LD `Event`, variabili CSS su `:root`, loader SVG inline, `manifest.json` e service worker:

```ts
const hash = createHash('sha1')
  .update(JSON.stringify(config))
  .update(Object.keys(bundle).sort().join());
for (const f of files) {
  const source = fs.readFileSync(path.join(couplePublic, f));
  hash.update(f).update(source);
  this.emitFile({ type: 'asset', fileName: f, source });
}
const sw = fs
  .readFileSync(path.resolve('src/sw.js'), 'utf-8')
  .replace("'__CACHE_NAME__'", JSON.stringify(`wedding-${config.slug}-${hash.digest('hex').slice(0, 8)}`))
  .replace("'__PRECACHE__'", JSON.stringify(precache, null, 2));
```

Il nome della cache è l’hash SHA-1 di configurazione, file del bundle e asset della coppia: ogni deploy invalida le cache vecchie senza incrementi manuali.

Sull’audio offline è saltato fuori un comportamento particolare di Safari iOS: richiede i file `.m4a` e `.mp3` con header HTTP `Range` e scarta una risposta `200` intera dalla cache. `src/sw.js` intercetta le richieste con header `Range` e ritaglia l’`ArrayBuffer` in cache in una `206 Partial Content`, così la musica parte anche senza rete.

## Una sola palette, con il contrasto WCAG AA testato in Vitest

Avorio, crema, bordeaux e seppia stanno definiti una volta sola in `src/config/theme.ts`. `createColors(overrides)` ricava da ogni esadecimale tre formati: la stringa HEX per meta tag e manifest, il numero (`0x581829`) per Three.js e i canali RGB separati da spazio (`88 24 41`) per le opacità di Tailwind.

Poiché ogni coppia può personalizzare i colori nella propria configurazione, `src/config/theme.test.ts` carica tutti i `couples/*/config.ts` con `import.meta.glob` e verifica tutte le otto coppie testo/sfondo rispetto al contrasto WCAG AA (`4.5:1`):

```ts
const couples = import.meta.glob<{ default: WeddingConfig }>('../../couples/*/config.ts', { eager: true });
const PAIRS = [
  ['sepia', 'ivory'],
  ['sepia', 'cream'],
  ['sepiaMuted', 'ivory'],
  ['sepiaMuted', 'cream'],
  ['bordeaux', 'ivory'],
  ['bordeaux', 'blush'],
  ['ivory', 'bordeaux'],
  ['ivory', 'bordeauxDark'],
] as const;

describe.each(Object.values(couples).map((m) => [m.default.slug, m.default] as const))('palette di %s', (_, config) => {
  const colors = createColors(config.colors);
  it.each(PAIRS)('%s su %s rispetta WCAG AA', (fg, bg) => {
    expect(contrastRatio(colors[fg].hex, colors[bg].hex)).toBeGreaterThanOrEqual(4.5);
  });
});
```

Un override poco leggibile blocca `vitest run` prima ancora del deploy.

## RSVP senza server e cosa cambierei

Un invito per un fine settimana non giustifica un backend da mantenere. `submitRSVP()` invia il JSON a una Web App di Google Apps Script con `Content-Type: text/plain;charset=utf-8`—che evita il preflight CORS permettendo comunque di leggere la risposta JSON—protetto da un `AbortController` con timeout di 12 secondi che interrompe anche `res.json()`. Ogni dispositivo genera un `responseId` stabile, così chi modifica la risposta aggiorna la propria riga sotto `LockService.getScriptLock()` invece di crearne una doppia. Prima di scrivere, lo script imposta `setNumberFormat('@')` sulle colonne di testo libero per impedire che Google Sheets interpreti come formule stringhe che iniziano con `=`, `+`, `-` o `@`.

Due cose che farei diversamente:

- **Spostare il calcolo delle texture su un Web Worker.** Disegnare le quattro mappe di altezza del pizzo e ricavarne le normali gira sul main thread mentre il loader SVG copre lo schermo, costando qualche centinaio di millisecondi sui telefoni più vecchi. Spostare `bakeSurface()` su un Web Worker con `OffscreenCanvas`, dove supportato, lascerebbe libero il thread UI all’avvio.
- **Sostituire Apps Script su eventi con molto traffico.** Costo zero e nessuna manutenzione vanno benissimo per un matrimonio, ma gli avvii a freddo possono far aspettare qualche secondo al primo RSVP. Con centinaia di risposte simultanee, una piccola funzione serverless su un database risponderebbe con tempi più stabili.

La demo pubblica con nomi di esempio è online su [wedding-3d-invite-demo-five.vercel.app](https://wedding-3d-invite-demo-five.vercel.app/).
