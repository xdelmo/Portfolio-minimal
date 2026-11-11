# Gli oggetti vivi

Il sito ha una vita sua: piccoli oggetti che reagiscono a chi lo visita. Tutti condividono le stesse regole: pixel su una griglia di 8px, forme a gradini, nessuna ombra morbida, e una versione ferma con reduced motion.

## La nuvola di pixel

L'hero disegna su un canvas una nuvola di pixel pastello, calcolata da funzioni pure con test unitari. Deriva con il vento attorno a una radura che segue il titolo, si ritrae dal puntatore e increspa al tocco; si mette in pausa fuori schermo.

## Cuciture e filo

- `PixelDissolve` (`src/app/pixel-dissolve/`) disegna le cuciture di pixel dove una banda incontra la pagina: livelli SVG a gradini guidati da una sola variabile `--p`, che `effects/dissolve.ts` lega allo scroll. Si formano entrando e si sbriciolano salendo verso l'header.
- Sulla home una linea accent scende lungo il margine sinistro e accende un nodo per sezione (`effects/thread.ts`).

## Il moai

Un moai a voxel in Three.js (`InstancedMesh`), caricato solo quando entra in vista. Respira, gira la testa verso il mouse, segue il puntatore con le pupille, fa una bolla di gomma con un doppio clic e dice qualche parola in un fumetto di pixel. Su desktop sta anche nell'angolo delle altre pagine.

Al suo posto c'è un'immagine ferma prerenderizzata con reduced motion, con il risparmio dati (`prefers-reduced-data`), senza WebGL o se il download fallisce. È anche la favicon, visto di fronte.

## Press start

Il codice Konami, cinque tocchi sul logo o il tasto «Press start» nel footer aprono un player card: classe, livello, punti esperienza e tre achievement disegnati come oggetti 16 × 16. È un modale nativo in un chunk lazy (`src/app/game/`), una ricompensa nascosta che non sta mai in mezzo.
