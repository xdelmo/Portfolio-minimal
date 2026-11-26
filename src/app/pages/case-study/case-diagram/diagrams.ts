import type { Locale } from '../../../core/i18n/locale';

export interface DiagramStep {
  node: string;
  detail: string;
}

export interface DiagramMode {
  label: string;
  caption: string;
  steps: readonly [DiagramStep, DiagramStep, DiagramStep];
  built?: boolean;
}

export interface CaseDiagramData {
  label: string;
  modes: readonly [DiagramMode, DiagramMode];
}

const DIAGRAMS: Record<Locale, Record<string, CaseDiagramData>> = {
  en: {
    apexflow: {
      label: 'Table architecture comparison',
      modes: [
        {
          label: 'All rows in the browser',
          caption: 'Loading every record into client memory works for small lists, then stalls as datasets grow.',
          steps: [
            { node: '1. Full fetch', detail: 'Every row travels over the network before the first table render.' },
            { node: '2. Memory filter', detail: 'Sorting and filtering run in browser memory on the entire payload.' },
            { node: '3. Ephemeral view', detail: 'Reloading or sharing the link drops page, sort and active filters.' },
          ],
        },
        {
          built: true,
          label: 'Server-side with Signals',
          caption: 'Every table in ApexFlow reuses TablePaginationState; sharing the URL shares the exact view.',
          steps: [
            { node: '1. URL and Signals', detail: 'TablePaginationState keeps page, sort and filters in the URL and in Signals.' },
            { node: '2. Debounced request', detail: 'RxJS debounces filter input and cancels any stale HTTP request in flight.' },
            { node: '3. One SQL page', detail: 'Spring Boot queries and returns only the visible slice in a single API call.' },
          ],
        },
      ],
    },
    pokeverba: {
      label: 'Answer verification flow',
      modes: [
        {
          label: 'Answers in the browser',
          caption: 'Shipping answers to the client exposes the daily puzzle in DevTools and lets checks leak letters.',
          steps: [
            { node: '1. Full puzzle payload', detail: 'The daily word list travels to the browser with the grid.' },
            { node: '2. Client check', detail: 'Letter-by-letter verification can be inspected or guessed locally.' },
            { node: '3. Static clues', detail: 'Clues risk repeating official descriptions or naming the Pokémon.' },
          ],
        },
        {
          built: true,
          label: 'Lengths only, server check',
          caption: 'The React grid knows only each word’s length; the server judges whole words once per day.',
          steps: [
            { node: '1. Date-seeded grid', detail: 'WordPress lays out 10 to 15 words up to 15 × 15 without 30-day repeats.' },
            { node: '2. Whole-word REST check', detail: 'The API validates complete words only, never revealing single letters.' },
            { node: '3. Cached until midnight', detail: 'Today’s puzzle stays cached until midnight in Rome, when the next generates.' },
          ],
        },
      ],
    },
    'wedding-3d-invite': {
      label: '3D render loop lifecycle',
      modes: [
        {
          label: 'Continuous render loop',
          caption: 'Keeping the Three.js loop running behind static slides wastes battery on guests’ phones.',
          steps: [
            { node: '1. Opening scene', detail: 'Three.js renders lace flaps, pearls and wax seal in real time.' },
            { node: '2. Background loop', detail: 'The GPU keeps redrawing an unseen canvas while guests scroll the slides.' },
            { node: '3. Battery drain', detail: 'Reading dates, maps and RSVP continues costing GPU cycles on mobile.' },
          ],
        },
        {
          built: true,
          label: 'Open once, then freeze',
          caption: 'Once the envelope opens, the Three.js loop freezes; a footer button replays it on demand.',
          steps: [
            { node: '1. Tap to open', detail: 'The wax seal lifts and the lace envelope opens on a single tap.' },
            { node: '2. Loop frozen', detail: 'The render loop stops on the resting frame, using zero GPU while reading.' },
            { node: '3. Eleven CSS slides', detail: 'Guests swipe eleven CSS scroll-snap slides with RSVP and offline PWA support.' },
          ],
        },
      ],
    },
  },
  it: {
    apexflow: {
      label: 'Confronto sull’architettura delle tabelle',
      modes: [
        {
          label: 'Tutte le righe nel browser',
          caption: 'Caricare ogni record in memoria funziona con poche righe, poi frena al crescere dei dati.',
          steps: [
            { node: '1. Scaricamento completo', detail: 'L’intero elenco viaggia in rete prima di mostrare la tabella.' },
            { node: '2. Filtro in memoria', detail: 'Ordinamento e filtri girano nel browser su tutti i record caricati.' },
            { node: '3. Vista effimera', detail: 'Ricaricare o condividere il link fa perdere pagina, ordine e filtri.' },
          ],
        },
        {
          built: true,
          label: 'Lato server con Signals',
          caption: 'Ogni tabella di ApexFlow riusa TablePaginationState: condividere l’URL condivide la vista esatta.',
          steps: [
            { node: '1. URL e Signals', detail: 'TablePaginationState tiene pagina, ordine e filtri nell’URL e nei signal.' },
            { node: '2. Richiesta con debounce', detail: 'RxJS attende la scrittura del filtro e annulla le richieste ormai superate.' },
            { node: '3. Una pagina SQL', detail: 'Spring Boot estrae e restituisce solo la fetta visibile con una sola chiamata.' },
          ],
        },
      ],
    },
    pokeverba: {
      label: 'Flusso di verifica delle risposte',
      modes: [
        {
          label: 'Risposte nel browser',
          caption: 'Inviare le soluzioni al client espone il cruciverba negli strumenti di sviluppo.',
          steps: [
            { node: '1. Parole nel payload', detail: 'L’elenco delle risposte arriva nel browser insieme allo schema.' },
            { node: '2. Controllo locale', detail: 'La verifica può essere ispezionata o usata lettera per lettera.' },
            { node: '3. Indizi non filtrati', detail: 'Senza regole sul testo gli indizi rischierebbero di copiare fonti ufficiali.' },
          ],
        },
        {
          built: true,
          label: 'Solo lunghezze, verifica sul server',
          caption: 'La griglia React conosce solo la lunghezza di ogni parola; la API giudica solo parole intere.',
          steps: [
            { node: '1. Griglia dal server', detail: 'WordPress dispone da 10 a 15 parole fino a 15 × 15 senza ripetizioni in 30 giorni.' },
            { node: '2. Verifica REST a parola', detail: 'La API controlla solo parole complete e non svela singole lettere.' },
            { node: '3. Cache fino a mezzanotte', detail: 'Lo schema del giorno resta in cache fino alla mezzanotte di Roma.' },
          ],
        },
      ],
    },
    'wedding-3d-invite': {
      label: 'Ciclo di vita della scena 3D',
      modes: [
        {
          label: 'Rendering continuo',
          caption: 'Tenere attivo il ciclo Three.js sotto le slide testuali consuma batteria sui telefoni.',
          steps: [
            { node: '1. Scena di apertura', detail: 'Three.js disegna lembi di pizzo, perle e sigillo di ceralacca.' },
            { node: '2. Ciclo in sottofondo', detail: 'La GPU continua a ridisegnare il canvas anche mentre si leggono le slide.' },
            { node: '3. Consumo inutile', detail: 'Consultare mappa, orari e RSVP continua a impegnare la grafica.' },
          ],
        },
        {
          built: true,
          label: 'Apertura e stop della GPU',
          caption: 'Aperta la busta, il ciclo di rendering si congela; un pulsante nel footer lo fa rivedere.',
          steps: [
            { node: '1. Tocco per aprire', detail: 'Il sigillo si solleva e i lembi della busta si aprono al primo tocco.' },
            { node: '2. Ciclo congelato', detail: 'Il rendering si ferma a busta aperta, azzerando il lavoro della GPU.' },
            { node: '3. Undici slide CSS', detail: 'Lo scroll snap guida undici slide con RSVP e supporto offline PWA.' },
          ],
        },
      ],
    },
  },
};

/** Returns the interactive stepped diagram for a case study in `locale`, if one is defined. */
export function caseDiagramFor(locale: Locale, slug: string): CaseDiagramData | undefined {
  return DIAGRAMS[locale][slug];
}
