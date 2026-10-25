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
    summary:
      'Emanuele Del Monte è un Frontend Engineer di Latina che sviluppa frontend enterprise in Angular con Signals, RxJS e NgRx.',
  },
  seo: {
    title: 'Emanuele Del Monte — Frontend Engineer Angular',
    description:
      'Sviluppo interfacce Angular che restano veloci anche con molti dati. Frontend Engineer in IPS S.p.A. a Latina.',
  },
  hero: {
    headline: 'Interfacce Angular veloci anche con molti dati.',
    lede: 'Sono Emanuele Del Monte, Frontend Engineer in IPS S.p.A., a Latina. Laureato in Ingegneria Informatica.',
  },
  aboutStatement: 'Curo le parti che nessuno vede ma tutti sentono.',
  about: [
    "Sono Emanuele Del Monte, Frontend Engineer a Latina. Costruisco frontend enterprise con Angular, Signals e RxJS: tabelle grandi che restano reattive, filtri che lavorano sul server, uno stato che resta prevedibile quando l'applicazione cresce. Prima di IPS ho lavorato circa due anni in una web agency su CRM, e-commerce e un configuratore di prodotto B2B. La mia tesi, ApexFlow, è una dashboard CRM full-stack con frontend Angular e backend Spring Boot.",
    "Claude Code fa parte della mia giornata: lo uso per scrivere e rivedere codice, impostare i test, orientarmi in API nuove e tenere aggiornata la documentazione. Ho anche studiato come i modelli linguistici arrivano a strumenti e dati reali, e ho costruito un server MCP per provarlo.",
  ],
  glance: [
    { label: 'Ruolo', value: 'Frontend Engineer, specializzato in Angular' },
    { label: 'Dove', value: 'Latina, Italia (anche da remoto)' },
    { label: 'Esperienza', value: 'Sviluppo frontend dal 2022' },
    { label: 'Stack principale', value: 'Angular, Signals, RxJS, NgRx, TypeScript' },
    { label: 'Formazione', value: 'Laurea in Ingegneria Informatica, Università Mercatorum, 2026' },
    { label: 'Lingue', value: 'Italiano madrelingua, inglese professionale' },
  ],
  projects: [
    {
      ...en('apexflow'),
      role: 'La mia tesi in Ingegneria Informatica, costruita durante il tirocinio in IPS S.p.A. nel 2026.',
      summary:
        'Una dashboard CRM e di analytics: Angular 19 con Signals e RxJS nel frontend, Spring Boot 3 e PostgreSQL nel backend.',
      repos: [
        { label: 'Codice del frontend', url: 'https://github.com/xdelmo/dashboard-tesi' },
      ],
      image: {
        src: 'images/work/apexflow.jpg',
        alt: 'La dashboard di ApexFlow con fatturato totale, ordini in attesa, clienti attivi e totali, il grafico annuale del fatturato e la barra di navigazione',
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
      ...en('pokeverba'),
      role: 'Un progetto con Matteo Terenzi, che scrive i contenuti; io costruisco e gestisco il sito. 2026.',
      summary: 'Un cruciverba quotidiano sui Pokémon, con la collezione dei Pokémon catturati e un blog, in italiano e in inglese.',
      repos: [{ label: 'Codice su GitHub', url: 'https://github.com/xdelmo/pokeverba-site' }],
      image: {
        src: 'images/work/pokeverba.jpg',
        alt: 'Il cruciverba Pokémon del giorno di PokèVerba: la griglia, le definizioni orizzontali e verticali, le schede delle regioni e i contatori di serie, catture e gettoni',
        width: 1600,
        height: 1011,
      },
      caseStudy: {
        context:
          'Un cruciverba sui Pokémon che cambia ogni giorno e si gioca nel browser. Il sito avrà pubblicità e link di affiliazione, quindi è un uso commerciale: nessun testo o immagine ufficiale può comparire, e ogni indizio deve essere nostro.',
        architecture: [
          'Un tema WordPress classico per tutto il sito (home, blog, pagine) e un plugin con le sue tabelle, una API REST e comandi WP-CLI.',
          "Un'app React compilata con Vite, inserita con uno shortcode: la griglia, la Collezione dei Pokémon catturati, traguardi e gettoni.",
          'Un generatore lato server dispone da 10 a 15 parole in una griglia fino a 15 × 15, con il seme dato dalla data e nessun Pokémon ripetuto entro 30 giorni.',
          'Italiano e inglese senza plugin multilingua; i progressi restano nel browser, nel local storage.',
        ],
        decisions: [
          {
            title: 'Le risposte non arrivano mai al browser',
            body: "L'app conosce solo la lunghezza di ogni parola. La verifica passa dalla API, che giudica solo parole intere, così il pulsante Verifica non svela le lettere una alla volta.",
          },
          {
            title: 'Indizi originali composti da fatti',
            body: "Gli indizi sono composti da fatti come tipo, generazione, altezza e peso, importati da PokéAPI, e ogni indizio che nomina la risposta viene scartato. Nessun testo ufficiale viene copiato.",
          },
          {
            title: 'Un cruciverba al giorno, in cache fino a mezzanotte',
            body: 'Il cruciverba di oggi resta in cache fino alla mezzanotte di Roma, quando si genera il successivo, così il server lavora una volta al giorno.',
          },
        ],
        outcome: 'Online su sbustiamobro.it e alla versione 1.18 a ottobre 2026, con un cruciverba regionale, gettoni e traguardi.',
      },
    },
    {
      ...en('wedding-3d-invite'),
      title: 'Invito di nozze 3D',
      role: 'Progettato e costruito da solo nel 2026, per il matrimonio di due amici.',
      summary:
        'Un invito di nozze digitale pensato per il telefono: una busta di pizzo in Three.js che si apre al tocco, poi la giornata raccontata in undici slide, con RSVP e funzionamento offline.',
      repos: [{ label: 'Codice su GitHub', url: 'https://github.com/xdelmo/wedding-3d-invite' }],
      image: {
        src: 'images/work/wedding-invite.jpg',
        alt: "L'invito chiuso: una busta di pizzo cosparsa di perle, chiusa da un sigillo di ceralacca bordeaux con le iniziali G&L, sopra l'invito a toccarla per aprirla",
        width: 1600,
        height: 1011,
      },
      caseStudy: {
        context:
          "Due miei amici volevano il loro invito di nozze di carta, in pizzo e perle, ricostruito per il telefono che gli ospiti hanno già in mano. Deve dare la sensazione di aprire una busta vera, poi rispondere a ogni domanda pratica: quando, dove, come arrivarci, cosa indossare e se ci sarai.",
        architecture: [
          "Single-page app in React e TypeScript, compilata con Vite e con lo stile in Tailwind CSS, pensata prima per il telefono; su desktop l'invito sta in una cornice grande come uno smartphone.",
          'La busta è una scena Three.js: lembi di pizzo che si aprono, un sigillo di ceralacca che si solleva e perle con materiali fisicamente realistici.',
          'Undici slide a schermo intero con lo scroll snap di CSS: conto alla rovescia, salvataggio nel calendario, mappe, programma, dress code, trasporti e RSVP.',
          "Le risposte all'RSVP finiscono in un foglio Google tramite Google Apps Script, così non c'è un server da gestire; un service worker fa funzionare l'invito anche offline, come PWA.",
        ],
        decisions: [
          {
            title: "Ogni parola dell'invito in un solo file di configurazione",
            body: "Nomi, data, luoghi, programma e RSVP stanno in una configurazione tipizzata, così la demo gira con nomi di esempio mentre l'invito vero tiene i suoi. Titolo, tag Open Graph, JSON-LD dell'evento, manifest e service worker nascono dalla stessa configurazione.",
          },
          {
            title: 'La scena 3D si ferma quando la busta è aperta',
            body: "Finita l'animazione di apertura il ciclo di rendering si congela, così leggere l'invito non costa GPU né batteria. Un pulsante nel footer fa rivedere l'apertura.",
          },
          {
            title: 'Una sola palette, con il contrasto sotto test',
            body: 'La palette bordeaux e avorio è definita una volta sola e arriva a Tailwind, Three.js, manifest e icone. Un test unitario blocca la build su ogni combinazione sotto il contrasto WCAG AA.',
          },
        ],
        outcome:
          "L'invito vero è dei miei amici e resta privato; la demo pubblica su Vercel mostra lo stesso invito con nomi di esempio.",
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
        'Ho costruito ApexFlow, una dashboard per dati complessi, in Angular 19 con Signals.',
        'Filtri e paginazione su grandi dataset, permessi per ruolo, unit test.',
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
        'Componenti legacy portati su Signals, con facade sullo store NgRx.',
        'Un query builder per filtri avanzati su big data, in Kendo Grid.',
        'Un player video HTML5 su misura con ricerca nei sottotitoli.',
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
    updated: 'Ultimo aggiornamento: 10 ottobre 2026',
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
          "Due voci nel local storage: theme ricorda se hai scelto il tema chiaro o quello scuro, explored quali case study hai letto, per un traguardo nel gioco nascosto del sito.",
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
      title: 'Bot Telegram',
      summary: "Tre bot che uso ogni giorno, ognuno risponde solo a me: scadenze dell'auto, il mio raccoglitore di carte Pokémon e i fogli presenze.",
      tags: ['TypeScript', 'Python', 'grammY', 'SQLite'],
      sprite: 'robot',
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
    player: 'Delmo',
    level: 3,
    next: 'Senior Frontend Engineer',
    xp: 0.6,
    achievements: [
      { title: 'Batterista', detail: 'Più di dieci anni dietro la batteria', sprite: 'drum' },
      { title: 'Raider hardcore', detail: 'World of Warcraft: il lavoro di squadra è il mio pane quotidiano', sprite: 'sword' },
      { title: 'Team pizza', detail: 'Se potessi mangiare una cosa sola per sempre', sprite: 'pizza' },
      { title: 'Distruttore di telefoni', detail: 'Ne ho brickati tantissimi', sprite: 'phone' },
    ],
    cheat: { title: 'Codice Konami', detail: '↑ ↑ ↓ ↓ ← → ← → B A', sprite: 'trophy' },
  },
  stack: [
    { name: 'Ogni giorno', items: ['Angular', 'Signals', 'RxJS', 'NgRx', 'TypeScript', 'SCSS', 'Claude Code'] },
    { name: 'In produzione', items: ['Spring Boot', 'Java', 'PostgreSQL', 'Docker', 'Node.js', 'Vitest', 'Playwright', 'ESLint', 'Git'] },
    { name: 'Nei progetti personali', items: ['Next.js', 'React', 'Supabase', 'Tailwind CSS', 'Flutter', 'Python', 'MCP'] },
  ],
};
