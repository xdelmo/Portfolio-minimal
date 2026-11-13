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
      'Sviluppo interfacce Angular che restano veloci anche con molti dati. Frontend Engineer in IPS S.p.A. ad Aprilia.',
  },
  hero: {
    headline: 'Ingegnere per metodo, curioso per natura',
    voice: 'curioso per natura',
    lede: 'Sono Emanuele, Frontend Engineer in IPS S.p.A. Costruisco interfacce Angular che restano veloci quando i dati diventano tanti, e lascio un easter egg a chi guarda bene.',
    peek: 'bene',
  },
  aboutStatement: 'Una tabella con migliaia di righe deve sembrare una con dieci.',
  aboutVoice: 'una con dieci.',
  about: [
    'Ho iniziato a costruire frontend nel 2022 in una web agency: CRM, e-commerce e Flexie, un configuratore B2B di imballaggi. Nel 2026 sono entrato in IPS S.p.A. come tirocinante, lì ho scritto la tesi e sono rimasto nel team di prodotto di una piattaforma di intelligence. La tesi, ApexFlow, è una dashboard CRM full-stack in Angular e Spring Boot.',
    "Claude Code fa parte della mia giornata: lo uso per scrivere e rivedere codice. Ho anche studiato il Model Context Protocol e ho costruito un server MCP per provarlo.",
  ],
  figures: [
    { value: '€1M', label: 'di ordini passati dal configuratore Flexie che ho costruito' },
    { value: '20', label: 'componenti legacy portati su Signals' },
    { value: '450', label: 'pagine in sei lingue, nella guida in-app che ho costruito' },
    { value: '40', label: 'paesi in cui si usa la piattaforma IPS su cui lavoro' },
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
      result: 'Una sola chiamata API per ogni cambio di filtro, su ogni tabella.',
      summary:
        'Una dashboard CRM e di analisi con tabelle che ordinano, filtrano e paginano sul server, e ogni vista salvata nell\'URL.',
      repos: [
        { label: 'Codice del frontend', url: 'https://github.com/xdelmo/dashboard-tesi' },
      ],
      image: {
        src: 'images/work/apexflow.webp',
        alt: 'La pagina ordini della dashboard di ApexFlow: una tabella con ID ordine, data, cliente, tipo di servizio, totale e stato del pagamento, con ordinamento, filtri e paginazione, accanto alla barra di navigazione',
        width: 1536,
        height: 1024,
      },
      caseStudy: {
        context:
          'ApexFlow è la mia tesi in Ingegneria Informatica: una piattaforma SaaS simulata con cui un\'azienda tecnologica gestisce clienti, abbonamenti, prodotti e ordini, con i vincoli di un sistema in produzione.',
        architecture: [
          'Single-page app in Angular 19 con componenti standalone e Signals per lo stato.',
          'PrimeNG per i componenti che mostrano molti dati: tabelle, form, dialog e notifiche.',
          'Accesso basato sui ruoli con route guard (impostazioni solo per gli admin, pagine profilo visibili al proprietario o a un admin).',
          'Interceptor HTTP che aggiungono il token e trasformano gli errori delle API in notifiche, in un unico punto.',
          'API REST in Spring Boot 3 su Java 21 con Spring Data JPA, PostgreSQL e Docker; frontend su Vercel, backend su Render.',
        ],
        decisions: [
          {
            title: 'Signals per lo stato, RxJS dove conta il tempo',
            body: "Lo stato dell'autenticazione vive nei signal, così i componenti non si iscrivono né si disiscrivono a mano. RxJS resta dove è lo strumento giusto: il debounce dei filtri e l'annullamento delle richieste non più attuali.",
          },
          {
            title: 'Tabelle lato server con una sola classe di stato riutilizzabile',
            body: "Una classe TablePaginationState tiene pagina, ordinamento e filtri nell'URL e collega signal e observable con toSignal e toObservable. Cambiare un filtro o una pagina fa partire una sola chiamata, e ogni tabella dell'app riusa la stessa logica.",
          },
          {
            title: 'Spring Boot invece di un backend JavaScript',
            body: 'Con NestJS avrei scritto tutto in TypeScript, ma Spring Boot era lo stack che la maggior parte degli annunci che leggevo chiedeva accanto ad Angular. Con due linguaggi il contratto tra client e server deve essere esplicito.',
          },
        ],
        outcome:
          'Mi sono laureato ad aprile 2026 con ApexFlow come tesi. La demo online ha account di prova con un clic, per un admin e per un utente normale.',
      },
    },
    {
      ...en('pokeverba'),
      role: 'Un progetto con un amico che scrive i contenuti; io costruisco e gestisco il sito. 2026.',
      result: 'Un cruciverba quotidiano le cui risposte non arrivano mai al browser.',
      summary: 'Un cruciverba quotidiano sui Pokémon, con la collezione dei Pokémon catturati e un blog, in italiano e in inglese.',
      repos: [{ label: 'Codice su GitHub', url: 'https://github.com/xdelmo/pokeverba-site' }],
      image: {
        src: 'images/work/pokeverba.webp',
        alt: 'Il cruciverba Pokémon del giorno di PokèVerba con due parole inserite: la griglia, le definizioni orizzontali e verticali, le schede delle regioni e i contatori di serie, catture e gettoni',
        width: 1536,
        height: 1024,
      },
      caseStudy: {
        context:
          'Un cruciverba sui Pokémon che cambia ogni giorno e si gioca nel browser. Il sito avrà pubblicità e link di affiliazione, quindi l\'uso è commerciale: nessun testo o immagine ufficiale può comparire, e ogni indizio deve essere nostro.',
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
            body: "Il generatore compone ogni indizio da fatti come tipo, generazione, altezza e peso, importati da PokéAPI, e scarta quelli che nominano la risposta. Nessun testo ufficiale viene copiato.",
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
      result: 'Un invito di nozze che si apre come una busta vera, poi smette di usare la GPU.',
      summary:
        'Un invito di nozze digitale pensato per il telefono: una busta di pizzo in Three.js che si apre al tocco, poi la giornata raccontata in undici slide, con RSVP e funzionamento offline.',
      repos: [{ label: 'Codice su GitHub', url: 'https://github.com/xdelmo/wedding-3d-invite' }],
      image: {
        src: 'images/work/wedding-invite.webp',
        alt: "L'invito chiuso da vicino: una busta di pizzo cosparsa di perle, chiusa da un sigillo di ceralacca bordeaux con le iniziali G&L",
        width: 1536,
        height: 1024,
      },
      caseStudy: {
        context:
          "Due miei amici volevano il loro invito di nozze di carta, in pizzo e perle, ricostruito per il telefono che gli ospiti hanno già in mano. Deve dare la sensazione di aprire una busta vera, poi dire all'ospite tutto quello che gli serve, fino all'RSVP.",
        architecture: [
          "Single-page app in React e TypeScript, compilata con Vite e con lo stile in Tailwind CSS, pensata prima per il telefono; su desktop l'invito sta in una cornice grande come uno smartphone.",
          'La busta è una scena Three.js: lembi di pizzo che si aprono, un sigillo di ceralacca che si solleva e perle con materiali fisicamente realistici.',
          'Undici slide a schermo intero con lo scroll snap di CSS, dal conto alla rovescia all\'RSVP.',
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
        'Ho costruito Flexie, un configuratore B2B per packaging flessibile: più di 100 combinazioni di materiali, formati e accessori, con il prezzo calcolato in tempo reale.',
        'Ho scritto plugin WordPress su misura per gli e-commerce e li ho collegati ad API REST di terze parti.',
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
        'Ho costruito ApexFlow, una dashboard CRM con tabelle lato server, in Angular 19 con Signals.',
        'Ho aggiunto filtri e paginazione lato server, permessi per ruolo e unit test.',
      ],
      tags: ['Angular', 'Signals', 'RxJS', 'PrimeNG', 'Tailwind CSS'],
      caseStudy: { slug: 'apexflow', label: 'Case study di ApexFlow' },
    },
    {
      period: '2026 – oggi',
      short: 'Frontend Specialist',
      title: 'Software Engineer, Frontend Specialist',
      org: 'IPS S.p.A.',
      summary: 'Nel team di una piattaforma enterprise di intelligence.',
      highlights: [
        'Ho portato oltre 20 componenti legacy su Signals, nel passaggio ad Angular 22.',
        'Ho creato una guida in-app: oltre 450 pagine in sei lingue, da più di 100 campi.',
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
      'Questo sito è il mio portfolio personale. Carica solo i propri script, senza statistiche né pubblicità, e tiene nel tuo browser solo quello che serve a ricordare le tue scelte.',
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
      summary: 'Un inserto parametrico per il bracciolo della portiera della mia auto, dal codice al file pronto per la stampa con un comando.',
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
      { title: 'Raider hardcore', detail: 'World of Warcraft: lavoro di squadra nei raid', sprite: 'sword' },
      { title: 'Team pizza', detail: 'Se potessi mangiare una cosa sola per sempre', sprite: 'pizza' },
    ],
    cheat: { title: 'Codice Konami', detail: '↑ ↑ ↓ ↓ ← → ← → B A', sprite: 'trophy' },
  },
  stack: [
    { name: 'Ogni giorno', items: ['Angular', 'Signals', 'RxJS', 'NgRx', 'TypeScript', 'SCSS', 'Claude Code'] },
    { name: 'In produzione', items: ['Spring Boot', 'Java', 'PostgreSQL', 'Docker', 'Node.js', 'Vitest', 'Playwright', 'ESLint', 'Git'] },
    { name: 'Nei progetti personali', items: ['Next.js', 'React', 'Supabase', 'Tailwind CSS', 'Flutter', 'Python', 'MCP'] },
  ],
};
