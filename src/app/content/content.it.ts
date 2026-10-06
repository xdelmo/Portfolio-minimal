import { CONTENT_EN } from './content.en';
import type { Project, SiteContent } from './content.model';

const en = (slug: string): Project => {
  const project = CONTENT_EN.projects.find((p) => p.slug === slug);
  if (!project) throw new Error(`Unknown project ${slug}`);
  return project;
};

export const CONTENT_IT: SiteContent = {
  person: {
    ...CONTENT_EN.person,
    location: 'Latina, Italia',
    availability: 'Disponibile per ruoli da remoto.',
    summary:
      'Emanuele Del Monte è un Frontend Engineer di Latina che sviluppa frontend enterprise in Angular con Signals, RxJS e NgRx.',
  },
  seo: {
    title: 'Emanuele Del Monte — Frontend Engineer Angular',
    description:
      'Sviluppo interfacce Angular che restano veloci anche con molti dati. Frontend Engineer in IPS S.p.A. a Latina, disponibile per ruoli da remoto.',
  },
  hero: {
    headline: 'Interfacce Angular veloci anche con molti dati.',
    lede: 'Frontend Engineer in IPS S.p.A., a Latina. Laureato in Ingegneria Informatica nel 2026.',
  },
  aboutStatement: 'Curo le parti che nessuno vede ma tutti sentono.',
  about:
    "Sono Emanuele Del Monte, Frontend Engineer a Latina. Costruisco frontend enterprise con Angular, Signals e RxJS: tabelle grandi che restano reattive, filtri che lavorano sul server, uno stato che resta prevedibile quando l'applicazione cresce. Prima di IPS ho lavorato circa due anni in una web agency su CRM, e-commerce e un configuratore di prodotto B2B. La mia tesi, ApexFlow, è una dashboard CRM full-stack con frontend Angular e backend Spring Boot. Claude Code fa parte della mia giornata: lo uso per scrivere e rivedere codice, impostare i test, orientarmi in API nuove e tenere aggiornata la documentazione. Ho anche studiato come i modelli linguistici arrivano a strumenti e dati reali, e ho costruito un server MCP per provarlo.",
  glance: [
    { label: 'Ruolo', value: 'Frontend Engineer, specializzato in Angular' },
    { label: 'Dove', value: 'Latina, Italia (anche da remoto)' },
    { label: 'Esperienza', value: 'Sviluppo frontend dal 2022' },
    { label: 'Stack principale', value: 'Angular, Signals, RxJS, NgRx, TypeScript' },
    { label: 'Formazione', value: 'Laurea in Ingegneria Informatica, Università Mercatorum, 2026' },
    { label: 'Lingue', value: 'Italiano madrelingua, inglese professionale' },
    { label: 'Disponibilità', value: 'Ruoli da remoto' },
  ],
  projects: [
    {
      ...en('apexflow'),
      summary:
        'Una dashboard CRM e di analytics: Angular 19 con Signals e RxJS nel frontend, Spring Boot 3 e PostgreSQL nel backend.',
      repos: [
        { label: 'Codice del frontend', url: 'https://github.com/xdelmo/dashboard-tesi' },
        { label: 'Codice del backend', url: 'https://github.com/xdelmo/backend-tesi' },
      ],
      image: {
        src: 'images/work/apexflow.jpg',
        alt: 'La dashboard di ApexFlow con i totali di fatturato, spese, utile e nuovi clienti, il grafico del fatturato e la barra di navigazione',
        width: 1600,
        height: 1011,
      },
      caseStudy: {
        context:
          'Per la tesi in Ingegneria Informatica volevo un progetto che affrontasse problemi reali, non un esercizio. ApexFlow simula una piattaforma SaaS con cui un\'azienda tecnologica gestisce clienti, abbonamenti, prodotti e ordini, con i vincoli di un sistema in produzione.',
        architecture: [
          'Single-page app in Angular 19 con componenti standalone e Signals per lo stato.',
          'PrimeNG per i componenti pieni di dati: tabelle, form, dialog e notifiche.',
          'Accesso basato sui ruoli con route guard (impostazioni solo per gli admin, pagine profilo visibili al proprietario o a un admin).',
          'Interceptor HTTP che aggiungono il token e trasformano gli errori delle API in notifiche, in un unico punto.',
          'API REST in Spring Boot 3 su Java 21 con Spring Data JPA, PostgreSQL e Docker; frontend su Vercel, backend su Render.',
        ],
        decisions: [
          {
            title: 'Signals per lo stato, RxJS dove conta il tempo',
            body: "Lo stato dell'autenticazione vive nei signal, così i componenti non si iscrivono né si disiscrivono a mano. RxJS resta dove è lo strumento giusto: il debounce dei filtri e l'annullamento delle richieste superate.",
          },
          {
            title: 'Tabelle lato server con una sola classe di stato riutilizzabile',
            body: "Una classe TablePaginationState tiene pagina, ordinamento e filtri nell'URL e collega signal e observable con toSignal e toObservable. Cambiare un filtro o una pagina fa partire una sola chiamata, e ogni tabella dell'app riusa la stessa logica.",
          },
          {
            title: 'Spring Boot invece di un backend JavaScript',
            body: 'NestJS mi avrebbe tenuto tutto in TypeScript, ma Spring Boot è quello che usa la maggior parte dei team enterprise. Far parlare due mondi diversi mi ha insegnato più che restare in uno solo.',
          },
        ],
        outcome:
          'Mi sono laureato ad aprile 2026 con ApexFlow come tesi. La demo online ha account di prova con un clic, per un admin e per un utente normale.',
      },
    },
    {
      ...en('ice-friends-breaker'),
      summary: 'Un gioco di carte per rompere il ghiaccio, installabile sul telefono come PWA e come app nativa.',
      repos: [{ label: 'Codice su GitHub', url: 'https://github.com/xdelmo/ice-friends-breaker' }],
      image: {
        src: 'images/work/ice-friends-breaker.jpg',
        alt: 'Ice Friends Breaker su un telefono: la carta con la domanda del giorno, il contatore della serie e la navigazione in basso',
        width: 600,
        height: 1299,
      },
      caseStudy: {
        context:
          'Un gioco di carte che dà agli amici qualcosa di meglio di cui parlare del meteo. Doveva sembrare un\'app nativa sul telefono ed essere veloce da costruire e gestire da solo.',
        architecture: [
          'Next.js 16 con App Router, Tailwind CSS v4 e componenti shadcn/ui.',
          "Supabase per database e autenticazione, con un pannello admin riservato per ruolo.",
          'Installabile come PWA e impacchettata per iOS e Android con Capacitor.',
        ],
        decisions: [
          {
            title: 'Una domanda al giorno, uguale per tutti',
            body: 'La domanda del giorno è la stessa per ogni utente e cambia ogni 24 ore, così gli amici possono parlarne anche se giocano lontani.',
          },
          {
            title: 'Mobile first, davvero',
            body: "Barra di navigazione in basso, tema scuro che segue il sistema e controlli a misura di dito: l'app nasce per il telefono e poi si allarga per il desktop.",
          },
        ],
        outcome: 'Online su Vercel, con serie di giorni consecutivi, più modalità di gioco e un pannello admin per ruolo per gestire domande e categorie.',
      },
    },
    {
      ...en('mcp-server'),
      summary:
        'Un server e un client Model Context Protocol che permettono a un LLM di leggere e modificare documenti tramite tool personalizzati.',
      repos: [{ label: 'Codice su GitHub', url: 'https://github.com/xdelmo/mcp-server' }],
      caseStudy: {
        context:
          "L'ho costruito per capire come i modelli linguistici si collegano a strumenti e dati reali con il Model Context Protocol, seguendo i due corsi MCP dell'Anthropic Academy.",
        architecture: [
          'Un server MCP in Python che espone tool (lettura, modifica, riassunto, ricerca, elenco delle cartelle consentite, lettura di una cartella), risorse e un template di prompt.',
          'Un client Python che parla con il server tramite input e output standard e gestisce sampling, avanzamento, log e cartelle consentite.',
        ],
        decisions: [
          {
            title: 'Accesso solo alle cartelle approvate',
            body: 'Il tool che legge le cartelle lavora solo dentro le radici esposte dal client, così il modello non può girare liberamente nel file system.',
          },
          {
            title: 'Funzioni deprecate tenute apposta',
            body: "Sampling, roots e logging sono stati deprecati nella specifica MCP a luglio 2026. L'esempio avanzato li mantiene a scopo didattico, mentre quello base mostra l'approccio attuale.",
          },
        ],
        outcome: 'Un riferimento funzionante per costruire integrazioni MCP, pubblico su GitHub.',
      },
    },
    {
      ...en('telegram-bots'),
      title: 'Bot Telegram',
      summary: "Tre bot che uso ogni giorno: scadenze dell'auto, il mio raccoglitore di carte Pokémon e i fogli presenze.",
      repos: [
        { label: "Bot delle scadenze dell'auto", url: 'https://github.com/xdelmo/auto-scadenze-bot' },
        { label: 'Bot del raccoglitore Pokémon', url: 'https://github.com/xdelmo/hoenn-binder' },
        { label: 'Bot delle presenze', url: 'https://github.com/xdelmo/presenz-lazy-bot' },
      ],
      caseStudy: {
        context:
          'Piccoli strumenti personali che mi tolgono una seccatura dalla settimana. Ognuno risponde solo a me, gira in Docker e tiene i dati in SQLite o in Excel.',
        architecture: [
          "Scadenze dell'auto: TypeScript eseguito nativamente su Node 24 con grammY e node:sqlite; promemoria per data e per chilometri, storico delle spese e backup mensili.",
          'Raccoglitore Pokémon: TypeScript, grammY, SQLite con Drizzle ORM e Vitest; tiene traccia di 135 carte e calcola pagina, riga e colonna nel raccoglitore fisico.',
          'Presenze: Python con una pianificazione nei giorni feriali che compila un foglio Excel e, una volta al mese, lo invia per email dopo aver chiesto conferma.',
        ],
        decisions: [
          {
            title: 'Niente chat intasate',
            body: 'Il bot del raccoglitore modifica lo stesso messaggio con le tastiere inline invece di mandarne di nuovi, così la chat resta leggibile.',
          },
          {
            title: 'Prima stima, poi ricorda',
            body: "Il bot dell'auto impara quanti chilometri faccio al mese e stima quando arriverò al prossimo tagliando, così i promemoria arrivano prima della scadenza, non dopo.",
          },
        ],
        outcome: 'Tutti e tre girano ogni giorno sul mio server di casa.',
      },
    },
  ],
  experience: [
    {
      period: '2022 – 2024',
      short: 'Frontend Developer',
      title: 'Frontend Developer',
      org: 'Web agency',
      summary: 'Circa due anni a costruire CRM, single-page app ed e-commerce per i clienti.',
      highlights: [
        'Flexie, un configuratore B2B per packaging flessibile: più di 100 combinazioni di materiali, formati e accessori, con il prezzo calcolato in tempo reale.',
        'Plugin WordPress su misura per gli e-commerce, collegati ad API REST di terze parti.',
      ],
      tags: ['Angular', 'Next.js', 'WordPress', 'PHP'],
    },
    {
      period: '2026',
      short: 'Tirocinio',
      title: 'Tirocinio in ingegneria del software',
      org: 'IPS S.p.A.',
      summary: 'Sono entrato nel team frontend mentre finivo la laurea.',
      highlights: [
        'Ho costruito ApexFlow, una dashboard per flussi di dati complessi, in Angular 19 con Signals.',
        'Filtri e paginazione su grandi quantità di dati, permessi per ruolo, unit test.',
      ],
      tags: ['Angular', 'Signals', 'RxJS', 'Tailwind CSS'],
      caseStudy: { slug: 'apexflow', label: 'Case study di ApexFlow' },
    },
    {
      period: '2026 – oggi',
      short: 'Frontend Specialist',
      title: 'Software Engineer, Frontend Specialist',
      org: 'IPS S.p.A.',
      summary: 'Nel team di prodotto di un gestionale enterprise per la cybersecurity.',
      highlights: [
        'Porto i componenti legacy su Signals, con facade tra loro e lo store NgRx.',
        'Un query builder per filtri avanzati su grandi quantità di dati, mostrati in Kendo Grid.',
        'Un player video HTML5 su misura che cerca nel testo dei sottotitoli.',
      ],
      tags: ['Angular', 'Signals', 'RxJS', 'NgRx', 'Kendo UI'],
    },
  ],
  studies: [
    {
      sprite: 'cap',
      period: '2026',
      title: 'Laurea in Ingegneria Informatica',
      org: 'Università Mercatorum',
      summary: 'Laureato ad aprile 2026 con ApexFlow, una dashboard CRM full-stack in Angular e Spring Boot.',
      caseStudy: { slug: 'apexflow', label: 'Case study di ApexFlow' },
    },
    {
      sprite: 'trophy',
      period: '2025',
      title: 'Agile Masterclass',
      org: 'Joinrs',
      summary: 'Due incontri, il mindset Agile e poi Scrum e Kanban, chiusi da un quiz che ho vinto.',
    },
    {
      sprite: 'terminal',
      period: '2026',
      title: 'Corsi su Claude Code e MCP',
      org: 'Anthropic Academy',
      summary: 'Claude Code 101, Claude Code in Action, Introduction to Model Context Protocol, i suoi temi avanzati e AI Fluency.',
    },
  ],
  privacy: {
    updated: 'Ultimo aggiornamento: 6 ottobre 2026',
    intro:
      'Questo sito è il mio portfolio personale. Non ha statistiche, pubblicità, tracciamento né script di terze parti: tiene nel tuo browser solo quello che serve a ricordare le tue scelte.',
    sections: [
      {
        heading: 'Chi è il titolare',
        paragraphs: ['Il titolare del trattamento è Emanuele Del Monte. Per qualsiasi domanda sui tuoi dati scrivi a info@emanueledelmonte.it.'],
      },
      {
        heading: 'Cosa tiene il sito nel tuo browser',
        paragraphs: [
          'Il cookie nf_lang ricorda la lingua che hai scelto con il selettore, così la home si apre in quella lingua la volta successiva. Dura un anno e arriva al server solo per scegliere la lingua.',
          'La voce theme nel local storage ricorda se hai scelto il tema chiaro o quello scuro.',
          "Tre voci nel session storage (intro, pausa delle animazioni e tenda della lingua) ricordano, finché non chiudi la scheda, se l'intro iniziale è già stata mostrata, se hai messo in pausa le animazioni e verso quale lingua stai passando.",
          'Sono preferenze tecniche: non identificano nessuno, non vengono condivise e non richiedono consenso. Puoi cancellarle quando vuoi dalle impostazioni del browser.',
        ],
      },
      {
        heading: 'Hosting',
        paragraphs: [
          "Il sito è ospitato da Netlify, Inc. Come ogni server web, tratta i dati tecnici di ogni richiesta (indirizzo IP, browser, pagina e orario) per consegnare le pagine e tenere il servizio sicuro. La base giuridica è il mio legittimo interesse a far funzionare il sito. Netlify ha sede negli Stati Uniti e il suo accordo sul trattamento dei dati copre i trasferimenti fuori dall'UE.",
        ],
      },
      {
        heading: 'Se mi scrivi',
        paragraphs: [
          'Se mi mandi un\'email, uso il tuo indirizzo e il tuo messaggio solo per risponderti, e li conservo per il tempo che serve alla conversazione. Non li condivido mai.',
        ],
      },
      {
        heading: 'Link ad altri siti',
        paragraphs: ['I link a GitHub, LinkedIn e alle demo dei progetti portano a siti con le loro informative sulla privacy.'],
      },
      {
        heading: 'I tuoi diritti',
        paragraphs: [
          'Puoi chiedere di accedere ai tuoi dati, correggerli o cancellarli, limitarne il trattamento o opporti, e riceverli in un formato portabile (GDPR, articoli da 15 a 21): scrivi a info@emanueledelmonte.it. Puoi anche presentare reclamo al Garante per la protezione dei dati personali (garanteprivacy.it).',
        ],
      },
    ],
  },
  sideQuests: [
    {
      title: 'PokèVerba',
      summary: 'Un cruciverba Pokémon quotidiano e un Pokédex personale: un plugin WordPress con dentro un\'app React, in stile Game Boy.',
      tags: ['WordPress', 'React', 'Zustand', 'Tailwind CSS'],
      repo: 'https://github.com/xdelmo/pokeverba-site',
      sprite: 'crossword',
    },
    {
      title: 'Porta-carte MagSafe',
      summary: "Un supporto stampato in 3D per una carta Pokémon sul retro dell'iPhone, modellato interamente in codice Python con controlli automatici degli incastri.",
      tags: ['Python', 'build123d', 'Stampa 3D'],
      repo: 'https://github.com/xdelmo/magsafe-cardholder',
      sprite: 'cardholder',
    },
    {
      title: 'Vano portaoggetti per la Volkswagen Up',
      summary: 'Un inserto parametrico per il bracciolo della portiera della mia auto, con una pipeline che va dal codice al file pronto per la stampa con un solo comando.',
      tags: ['Python', 'build123d', 'Bambu Studio'],
      repo: 'https://github.com/xdelmo/volkswagen-up-door-storage-box',
      sprite: 'car',
    },
  ],
  game: {
    level: 3,
    next: 'Senior Frontend Engineer',
    xp: 0.6,
    achievements: [
      { title: 'Laureato', detail: 'Laurea in Ingegneria Informatica, 2026', sprite: 'cap' },
      { title: 'Agile Masterclass', detail: 'Ho vinto il quiz finale', sprite: 'trophy' },
      { title: 'Flutter', detail: 'Anche questo nella cassetta degli attrezzi', sprite: 'phone' },
    ],
  },
  stack: [
    { name: 'Ogni giorno', items: ['Angular', 'Signals', 'RxJS', 'NgRx', 'TypeScript', 'SCSS', 'Claude Code'] },
    { name: 'In produzione', items: ['Spring Boot', 'Java', 'PostgreSQL', 'Docker', 'Node.js', 'Vitest', 'Playwright', 'ESLint', 'Git'] },
    { name: 'Nei progetti personali', items: ['Next.js', 'React', 'Supabase', 'Tailwind CSS', 'Flutter', 'Python', 'MCP'] },
  ],
};
