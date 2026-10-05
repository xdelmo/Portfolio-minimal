# Portfolio v2 · Piano 2: Contenuti — Implementation Plan

## Stato (2026-10-06): completato. I contenuti vivono in `src/app/content/content.{en,it}.ts`; lo Stack è diventato "Strumenti per livelli" nel piano 12.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** riempire lo scheletro del Piano 1 con i contenuti reali in IT ed EN: progetti con case study completi e immagini, side quests, esperienza, stack e blocco "At a glance", secondo la spec §3 e §9.

**Architecture:** il modello dei contenuti (`src/app/content/content.model.ts`) cresce con tipi per case study, esperienza, side quests, stack e "At a glance". Ogni sezione della home diventa un componente presentazionale in `src/app/sections/` che riceve dati tramite `input()` e non inietta nulla: la home inietta `CONTENT` e passa i dati. La pagina case study rende le sezioni del case study dal modello. Le immagini stanno in `public/images/work/` e passano da `NgOptimizedImage`.

**Tech Stack:** Angular 22 (standalone, zoneless, signals, `NgOptimizedImage`), SCSS, Vitest, Playwright + axe, ESLint strict.

**Spec:** `docs/superpowers/specs/2026-10-03-portfolio-v2-design.md` (§3 struttura e contenuti, §4.2 tipografia, §9 GEO, §11 WCAG 2.2 AA)

**Base:** Piano 1 completato sul branch `v2` (vedi `docs/superpowers/plans/2026-10-03-portfolio-v2-plan-1-fondamenta.md`, sezione "Sistema visivo", che vale anche qui).

## Global Constraints

- Node 24: nei comandi `export PATH="$HOME/.local/node/current/bin:$PATH";`.
- Ogni task termina con `npm run lint` (0 errori, 0 warning), `npx ng test --no-watch` e `npm run build` verdi; i task che toccano l'interfaccia anche con `npm run e2e`.
- Stili in SCSS; colori solo tramite variabili CSS (`--fg`, `--fg-muted`, `--link`, `--accent`, `--surface`, `--rule`); spaziature solo `--space-*`; breakpoint con `@include bp.up(md)`.
- Sistema visivo del Piano 1: niente etichette in maiuscolo sopra i titoli, niente stringhe di metadati in monospace, niente "→" nei link, sentence case. Numeri solo dove il contenuto è una sequenza (la timeline dell'esperienza).
- WCAG 2.2 AA: ogni immagine significativa ha `alt` descrittivo; liste vere (`<ul>`/`<ol>`/`<dl>`); titoli in ordine (`h1` → `h2` → `h3`); target ≥ 24×24 px.
- Testi IT ed EN con la stessa struttura: stesso numero di elementi in ogni lista, stessi `slug`, URL e nomi di tecnologie. Nessun fatto inventato: date solo come anni dove il mese non è confermato.
- **Niente CV online.** Località "Latina, Italy" / "Latina, Italia".
- Messaggi di commit conventional commits, chiusi da:
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` e `Claude-Session: https://claude.ai/code/session_014t4Wg7xppYvDZKWdUJ4WtA`.

## Review Focus

1. **Parole lunghe a 320 px** (indirizzo email, nomi delle repo, "Model Context Protocol"): niente scroll orizzontale né testo tagliato. → Task 5 estende il test di overflow a tutte le pagine dei case study.
2. **Progetto senza demo o senza immagine** (MCP Server, Telegram bots): nessun bottone vuoto, nessuno spazio riservato a un'immagine assente. → test in Task 3.
3. **Campo mancante nella traduzione italiana**: il build non deve passare con un case study IT più corto dell'EN. → test di parità in Task 1.
4. **Immagini nella build italiana**: con `<base href="/it/">` i percorsi relativi devono risolvere (le immagini sono copiate in ogni cartella di lingua). → test e2e in Task 5 che verifica `naturalWidth > 0` in `/en/` e `/it/`.
5. **Lettore di schermo sulla timeline**: l'ordine e i periodi devono essere letti in modo sensato (lista ordinata, periodo come testo prima del titolo). → test in Task 4.

---

### Task 1: Modello dei contenuti esteso e testi IT/EN

**Files:**
- Modify: `src/app/content/content.model.ts`, `src/app/content/content.en.ts`, `src/app/content/content.it.ts`, `src/app/content/content.spec.ts`

**Interfaces:**
- Consumes: `SiteContent`, `Project`, `Person` (Piano 1).
- Produces:
  - `interface Repo { label: string; url: string }`
  - `interface ProjectImage { src: string; alt: string; width: number; height: number }`
  - `interface Decision { title: string; body: string }`
  - `interface CaseStudyBody { context: string; architecture: readonly string[]; decisions: readonly Decision[]; outcome: string }`
  - `Project` diventa `{ slug; title; summary; stack; repos: readonly Repo[]; demoUrl?: string; image?: ProjectImage; caseStudy: CaseStudyBody }` (sostituisce `repoUrls`)
  - `interface ExperienceItem { period: string; title: string; org: string; summary: string }`
  - `interface SideQuest { title: string; summary: string; tags: readonly string[] }`
  - `interface StackGroup { name: string; items: readonly string[] }`
  - `interface GlanceItem { label: string; value: string }`
  - `SiteContent` aggiunge `glance: readonly GlanceItem[]`, `experience: readonly ExperienceItem[]`, `sideQuests: readonly SideQuest[]`, `stack: readonly StackGroup[]`

- [ ] **Step 1: Test di parità (RED)**

Sostituisci `src/app/content/content.spec.ts`:

```ts
import { CONTENT_EN } from './content.en';
import { CONTENT_IT } from './content.it';

describe('content', () => {
  it('has the same projects, in the same order, in both languages', () => {
    expect(CONTENT_IT.projects.map((p) => p.slug)).toEqual(CONTENT_EN.projects.map((p) => p.slug));
  });

  it('uses url-safe slugs', () => {
    for (const p of CONTENT_EN.projects) expect(p.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('translates every summary', () => {
    CONTENT_EN.projects.forEach((p, i) => {
      expect(CONTENT_IT.projects[i].summary).not.toBe(p.summary);
    });
  });

  it('gives every project a case study with the same shape in both languages', () => {
    CONTENT_EN.projects.forEach((en, i) => {
      const it = CONTENT_IT.projects[i];
      expect(en.caseStudy.architecture.length).toBeGreaterThan(0);
      expect(en.caseStudy.decisions.length).toBeGreaterThan(0);
      expect(it.caseStudy.architecture.length).toBe(en.caseStudy.architecture.length);
      expect(it.caseStudy.decisions.length).toBe(en.caseStudy.decisions.length);
      expect(it.caseStudy.context).not.toBe(en.caseStudy.context);
      expect(it.repos.map((r) => r.url)).toEqual(en.repos.map((r) => r.url));
    });
  });

  it('keeps images identical across languages and describes them in each', () => {
    CONTENT_EN.projects.forEach((en, i) => {
      const it = CONTENT_IT.projects[i];
      expect(it.image?.src).toBe(en.image?.src);
      if (en.image && it.image) expect(it.image.alt).not.toBe(en.image.alt);
    });
  });

  it('has the same number of experience, side quest, stack and glance entries', () => {
    expect(CONTENT_IT.experience.length).toBe(CONTENT_EN.experience.length);
    expect(CONTENT_IT.sideQuests.length).toBe(CONTENT_EN.sideQuests.length);
    expect(CONTENT_IT.stack.map((g) => g.items)).toEqual(CONTENT_EN.stack.map((g) => g.items));
    expect(CONTENT_IT.glance.length).toBe(CONTENT_EN.glance.length);
  });
});
```

Run: `npx ng test --no-watch --include src/app/content/content.spec.ts`
Expected: FAIL in compilazione (`caseStudy`, `repos`, `experience`… non esistono).

- [ ] **Step 2: Estendi `src/app/content/content.model.ts`**

```ts
export interface Person {
  name: string;
  role: string;
  employer: string;
  location: string;
  availability: string;
  email: string;
  linkedin: string;
  github: string;
  knowsAbout: readonly string[];
}

export interface Repo {
  label: string;
  url: string;
}

export interface ProjectImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface Decision {
  title: string;
  body: string;
}

export interface CaseStudyBody {
  context: string;
  architecture: readonly string[];
  decisions: readonly Decision[];
  outcome: string;
}

export interface Project {
  slug: string;
  title: string;
  summary: string;
  stack: readonly string[];
  repos: readonly Repo[];
  demoUrl?: string;
  image?: ProjectImage;
  caseStudy: CaseStudyBody;
}

export interface ExperienceItem {
  period: string;
  title: string;
  org: string;
  summary: string;
}

export interface SideQuest {
  title: string;
  summary: string;
  tags: readonly string[];
}

export interface StackGroup {
  name: string;
  items: readonly string[];
}

export interface GlanceItem {
  label: string;
  value: string;
}

export interface SiteContent {
  person: Person;
  hero: { headline: string; lede: string };
  about: string;
  glance: readonly GlanceItem[];
  projects: readonly Project[];
  experience: readonly ExperienceItem[];
  sideQuests: readonly SideQuest[];
  stack: readonly StackGroup[];
}
```

- [ ] **Step 3: Contenuti inglesi `src/app/content/content.en.ts`**

Sostituisci il file con:

```ts
import { SiteContent } from './content.model';

export const CONTENT_EN: SiteContent = {
  person: {
    name: 'Emanuele Del Monte',
    role: 'Frontend Engineer',
    employer: 'IPS S.p.A.',
    location: 'Latina, Italy',
    availability: 'Open to remote and on-site roles from March 2027.',
    email: 'info@emanueledelmonte.it',
    linkedin: 'https://www.linkedin.com/in/emanueledelmonte/',
    github: 'https://github.com/xdelmo',
    knowsAbout: ['Angular', 'Angular Signals', 'RxJS', 'TypeScript', 'PrimeNG', 'Spring Boot'],
  },
  hero: {
    headline: 'I build Angular interfaces that stay fast when the data gets big.',
    lede: 'Frontend Engineer at IPS S.p.A., based in Latina, Italy. Computer Engineering graduate, 2026.',
  },
  about:
    'Emanuele Del Monte is a Frontend Engineer based in Latina, Italy, who builds enterprise front ends with Angular, Signals and RxJS. I care about the parts users never see but always feel: large tables that stay responsive, filters that run on the server, state that stays predictable when the app grows. Before IPS I spent about two years at a web agency building CRMs, e-commerce sites and a B2B product configurator. My thesis, ApexFlow, is a full-stack CRM dashboard with an Angular front end and a Spring Boot back end.',
  glance: [
    { label: 'Role', value: 'Frontend Engineer, Angular specialist' },
    { label: 'Based in', value: 'Latina, Italy (remote-friendly)' },
    { label: 'Experience', value: 'About 3 years building web front ends' },
    { label: 'Main stack', value: 'Angular, Signals, RxJS, TypeScript, PrimeNG' },
    { label: 'Education', value: 'BSc in Computer Engineering, Università Mercatorum, 2026' },
    { label: 'Availability', value: 'Remote and on-site roles from March 2027' },
  ],
  projects: [
    {
      slug: 'apexflow',
      title: 'ApexFlow',
      summary:
        'A CRM and analytics dashboard: Angular 19 with Signals and RxJS on the front end, Spring Boot 3 and PostgreSQL on the back end.',
      stack: ['Angular', 'Signals', 'RxJS', 'PrimeNG', 'Spring Boot', 'PostgreSQL'],
      repos: [
        { label: 'Front-end code', url: 'https://github.com/xdelmo/dashboard-tesi' },
        { label: 'Back-end code', url: 'https://github.com/xdelmo/backend-tesi' },
      ],
      demoUrl: 'https://dashboard-tesi.vercel.app/welcome',
      image: {
        src: 'images/work/apexflow.jpg',
        alt: 'ApexFlow dashboard with revenue charts, a customer table and the navigation sidebar',
        width: 1600,
        height: 1011,
      },
      caseStudy: {
        context:
          'For my Computer Engineering thesis I wanted a project that faced real problems, not a toy. ApexFlow simulates a SaaS platform that a tech company would use to manage customers, subscriptions, products and orders, with the constraints of a production system.',
        architecture: [
          'Angular 19 single-page app with standalone components and Signals for state.',
          'PrimeNG for data-heavy components: tables, forms, dialogs and toasts.',
          'Role-based access with route guards (admin-only settings, profile pages limited to the owner or an admin).',
          'HTTP interceptors that attach the bearer token and turn API errors into toast notifications in one place.',
          'Spring Boot 3 REST API on Java 21 with Spring Data JPA, PostgreSQL and Docker; front end on Vercel, back end on Render.',
        ],
        decisions: [
          {
            title: 'Signals for state, RxJS where time matters',
            body: 'Authentication state lives in signals, so the components never subscribe or unsubscribe by hand. RxJS stays where it is the right tool: debouncing filters and cancelling stale requests.',
          },
          {
            title: 'Server-side tables with one reusable state class',
            body: 'A TablePaginationState class keeps page, sort and filters in the URL and bridges signals and observables with toSignal and toObservable. Changing a filter or a page triggers exactly one API call, and every table in the app reuses the same logic.',
          },
          {
            title: 'Spring Boot instead of a JavaScript back end',
            body: 'NestJS would have kept everything in TypeScript, but Spring Boot is what most enterprise teams run. Making the two worlds talk taught me more than staying in one.',
          },
        ],
        outcome:
          'I graduated in April 2026 with ApexFlow as my thesis. The live demo has one-click demo accounts for an admin and a regular user.',
      },
    },
    {
      slug: 'ice-friends-breaker',
      title: 'Ice Friends Breaker',
      summary: 'A social card game to break the ice, installable on phones as a PWA and native app.',
      stack: ['Next.js', 'Supabase', 'Tailwind CSS', 'Capacitor'],
      repos: [{ label: 'Code on GitHub', url: 'https://github.com/xdelmo/ice-friends-breaker' }],
      demoUrl: 'https://ice-friends-breaker.vercel.app',
      image: {
        src: 'images/work/ice-friends-breaker.jpg',
        alt: 'Ice Friends Breaker on a phone: the daily question card, the streak counter and the bottom navigation',
        width: 600,
        height: 1299,
      },
      caseStudy: {
        context:
          'A card game that gives friends something better to talk about than the weather. It had to feel like a native app on a phone and be quick to build and run on my own.',
        architecture: [
          'Next.js 16 with the App Router, Tailwind CSS v4 and shadcn/ui components.',
          'Supabase for the database and authentication, with an admin panel limited by role.',
          'Installable as a PWA and packaged for iOS and Android with Capacitor.',
        ],
        decisions: [
          {
            title: 'One daily question for everyone',
            body: 'The daily drop is the same for every user and changes every 24 hours, so friends can talk about the same question even when they play apart.',
          },
          {
            title: 'Mobile first, for real',
            body: 'A bottom navigation bar, dark mode that follows the system and touch-sized controls: the app is designed for the phone and then widened for the desktop.',
          },
        ],
        outcome: 'Live on Vercel, with streaks, multiple game modes and a role-based admin panel to manage questions and categories.',
      },
    },
    {
      slug: 'mcp-server',
      title: 'MCP Server',
      summary:
        'A Model Context Protocol server and client that lets an LLM read and edit documents through custom tools.',
      stack: ['Python', 'MCP'],
      repos: [{ label: 'Code on GitHub', url: 'https://github.com/xdelmo/mcp-server' }],
      caseStudy: {
        context:
          'I built this to learn how language models connect to real tools and data with the Model Context Protocol, following the two MCP courses of the Anthropic Academy.',
        architecture: [
          'A Python MCP server that exposes tools (read, edit, summarize, research, list roots, read directory), resources and a prompt template.',
          'A Python client that talks to the server over standard input and output and handles sampling, progress, logging and roots.',
        ],
        decisions: [
          {
            title: 'Access limited to approved folders',
            body: 'The directory tool only reads inside the roots the client exposes, so the model cannot wander around the file system.',
          },
          {
            title: 'Keeping deprecated features, on purpose',
            body: 'Sampling, roots and logging were deprecated in the MCP specification in July 2026. The advanced example keeps them for learning, while the basic example shows the current approach.',
          },
        ],
        outcome: 'A working reference for building MCP integrations, public on GitHub.',
      },
    },
    {
      slug: 'telegram-bots',
      title: 'Telegram bots',
      summary: 'Three bots I use every day: car deadlines, my Pokémon TCG binder and attendance timesheets.',
      stack: ['TypeScript', 'Python', 'grammY', 'SQLite', 'Docker'],
      repos: [
        { label: 'Car deadlines bot', url: 'https://github.com/xdelmo/auto-scadenze-bot' },
        { label: 'Pokémon binder bot', url: 'https://github.com/xdelmo/hoenn-binder' },
        { label: 'Timesheet bot', url: 'https://github.com/xdelmo/presenz-lazy-bot' },
      ],
      caseStudy: {
        context:
          'Small personal tools that remove a chore from my week. Each one answers only to me, runs in Docker and keeps its data in SQLite or Excel.',
        architecture: [
          'Car deadlines: TypeScript run natively on Node 24 with grammY and node:sqlite; reminders by date and by mileage, expense history and monthly backups.',
          'Pokémon binder: TypeScript, grammY, SQLite with Drizzle ORM and Vitest; tracks 135 cards and computes page, row and column in the physical binder.',
          'Timesheet: Python with a weekday schedule that fills an Excel sheet and, once a month, emails it after asking for confirmation.',
        ],
        decisions: [
          {
            title: 'No chat clutter',
            body: 'The binder bot edits the same message through inline keyboards instead of sending new ones, so the chat stays readable.',
          },
          {
            title: 'Estimate, then remind',
            body: 'The car bot learns how many kilometres I drive per month and estimates when I will reach the next service, so reminders arrive before the deadline, not after.',
          },
        ],
        outcome: 'All three run every day on my home server.',
      },
    },
  ],
  experience: [
    {
      period: '2026 – present',
      title: 'Software Engineer, Frontend Specialist',
      org: 'IPS S.p.A.',
      summary: 'Enterprise front ends in Angular: data-heavy tables with server-side pagination and filtering, reactive state with Signals and RxJS.',
    },
    {
      period: '2026',
      title: 'Software engineering intern',
      org: 'IPS S.p.A.',
      summary: 'Joined the frontend team while finishing my degree, working on the same problems I then tackled in my thesis.',
    },
    {
      period: '2026',
      title: 'BSc in Computer Engineering',
      org: 'Università Mercatorum',
      summary: 'Graduated in April 2026 with ApexFlow, a full-stack CRM dashboard built with Angular and Spring Boot.',
    },
    {
      period: 'About 2 years',
      title: 'Frontend Developer',
      org: 'Web agency',
      summary: 'CRMs, e-commerce sites and Flexie, a B2B configurator for flexible packaging that handles more than 100 combinations of materials, formats and accessories with real-time pricing.',
    },
  ],
  sideQuests: [
    {
      title: 'PokèVerba',
      summary: 'A daily Pokémon crossword and a personal Pokédex: a WordPress plugin with a React app inside, styled like a Game Boy.',
      tags: ['WordPress', 'React', 'Zustand', 'Tailwind CSS'],
    },
    {
      title: 'MagSafe card holder',
      summary: 'A 3D-printed holder for one Pokémon card on the back of an iPhone, modelled entirely in Python code with automatic fit checks.',
      tags: ['Python', 'build123d', '3D printing'],
    },
    {
      title: 'Volkswagen Up storage tray',
      summary: 'A parametric insert for the door armrest of my car, with a pipeline that goes from code to a ready-to-print file in one command.',
      tags: ['Python', 'build123d', 'Bambu Studio'],
    },
  ],
  stack: [
    { name: 'Front end', items: ['Angular', 'Signals', 'RxJS', 'TypeScript', 'PrimeNG', 'Tailwind CSS', 'SCSS'] },
    { name: 'Back end and data', items: ['Spring Boot', 'Java', 'PostgreSQL', 'Supabase', 'Node.js'] },
    { name: 'Quality and tooling', items: ['Vitest', 'Playwright', 'ESLint', 'Git', 'Docker'] },
    { name: 'Also comfortable with', items: ['React', 'Next.js', 'Flutter', 'Python'] },
  ],
};
```

- [ ] **Step 4: Contenuti italiani `src/app/content/content.it.ts`**

Sostituisci il file con:

```ts
import { CONTENT_EN } from './content.en';
import { Project, SiteContent } from './content.model';

const en = (slug: string): Project => {
  const project = CONTENT_EN.projects.find((p) => p.slug === slug);
  if (!project) throw new Error(`Unknown project ${slug}`);
  return project;
};

export const CONTENT_IT: SiteContent = {
  person: {
    ...CONTENT_EN.person,
    location: 'Latina, Italia',
    availability: 'Disponibile per ruoli da remoto e in sede da marzo 2027.',
  },
  hero: {
    headline: 'Costruisco interfacce Angular che restano veloci anche quando i dati crescono.',
    lede: 'Frontend Engineer in IPS S.p.A., a Latina. Laureato in Ingegneria Informatica nel 2026.',
  },
  about:
    "Emanuele Del Monte è un Frontend Engineer di Latina che costruisce frontend enterprise con Angular, Signals e RxJS. Mi interessano le parti che l'utente non vede ma sente sempre: tabelle grandi che restano reattive, filtri che lavorano sul server, uno stato che resta prevedibile quando l'applicazione cresce. Prima di IPS ho lavorato circa due anni in una web agency su CRM, e-commerce e un configuratore di prodotto B2B. La mia tesi, ApexFlow, è una dashboard CRM full-stack con frontend Angular e backend Spring Boot.",
  glance: [
    { label: 'Ruolo', value: 'Frontend Engineer, specializzato in Angular' },
    { label: 'Dove', value: 'Latina, Italia (anche da remoto)' },
    { label: 'Esperienza', value: 'Circa 3 anni nello sviluppo frontend' },
    { label: 'Stack principale', value: 'Angular, Signals, RxJS, TypeScript, PrimeNG' },
    { label: 'Formazione', value: 'Laurea in Ingegneria Informatica, Università Mercatorum, 2026' },
    { label: 'Disponibilità', value: 'Ruoli da remoto e in sede da marzo 2027' },
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
        alt: 'La dashboard di ApexFlow con i grafici del fatturato, la tabella dei clienti e la barra di navigazione',
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
      period: '2026 – oggi',
      title: 'Software Engineer, Frontend Specialist',
      org: 'IPS S.p.A.',
      summary: 'Frontend enterprise in Angular: tabelle piene di dati con paginazione e filtri lato server, stato reattivo con Signals e RxJS.',
    },
    {
      period: '2026',
      title: 'Tirocinio in ingegneria del software',
      org: 'IPS S.p.A.',
      summary: 'Sono entrato nel team frontend mentre finivo la laurea, lavorando sugli stessi problemi che ho poi affrontato nella tesi.',
    },
    {
      period: '2026',
      title: 'Laurea in Ingegneria Informatica',
      org: 'Università Mercatorum',
      summary: 'Laureato ad aprile 2026 con ApexFlow, una dashboard CRM full-stack costruita con Angular e Spring Boot.',
    },
    {
      period: 'Circa 2 anni',
      title: 'Frontend Developer',
      org: 'Web agency',
      summary: 'CRM, e-commerce e Flexie, un configuratore B2B per packaging flessibile che gestisce più di 100 combinazioni di materiali, formati e accessori con il prezzo calcolato in tempo reale.',
    },
  ],
  sideQuests: [
    {
      title: 'PokèVerba',
      summary: 'Un cruciverba Pokémon quotidiano e un Pokédex personale: un plugin WordPress con dentro un\'app React, in stile Game Boy.',
      tags: ['WordPress', 'React', 'Zustand', 'Tailwind CSS'],
    },
    {
      title: 'Porta-carte MagSafe',
      summary: "Un supporto stampato in 3D per una carta Pokémon sul retro dell'iPhone, modellato interamente in codice Python con controlli automatici degli incastri.",
      tags: ['Python', 'build123d', 'Stampa 3D'],
    },
    {
      title: 'Vano portaoggetti per la Volkswagen Up',
      summary: 'Un inserto parametrico per il bracciolo della portiera della mia auto, con una pipeline che va dal codice al file pronto per la stampa con un solo comando.',
      tags: ['Python', 'build123d', 'Bambu Studio'],
    },
  ],
  stack: [
    { name: 'Frontend', items: ['Angular', 'Signals', 'RxJS', 'TypeScript', 'PrimeNG', 'Tailwind CSS', 'SCSS'] },
    { name: 'Backend e dati', items: ['Spring Boot', 'Java', 'PostgreSQL', 'Supabase', 'Node.js'] },
    { name: 'Qualità e strumenti', items: ['Vitest', 'Playwright', 'ESLint', 'Git', 'Docker'] },
    { name: 'Uso anche', items: ['React', 'Next.js', 'Flutter', 'Python'] },
  ],
};
```

- [ ] **Step 5: Adegua i consumatori al nuovo modello**

`CaseStudy` (Piano 1) usa `p.repoUrls`: sostituiscilo temporaneamente con `p.repos` e `repo.url`, così la build resta verde; il Task 3 riscrive la pagina.

Run: `npx ng test --no-watch && npm run lint && npm run build`
Expected: content.spec PASS (6 test), tutto verde. Se `case-study.spec.ts` fallisce per il cambio di modello, aggiorna solo il selettore del link al repo.

- [ ] **Step 6: Immagini dei progetti**

```bash
mkdir -p public/images/work
git show master:content/images/dashboard-tesi.png > /tmp/apexflow.png
sips -s format jpeg -s formatOptions 82 --resampleWidth 1600 /tmp/apexflow.png --out public/images/work/apexflow.jpg
gh api repos/xdelmo/ice-friends-breaker/contents/public/screenshots/dashboard-mobile.png --jq .content | base64 -d > /tmp/ice.png
sips -s format jpeg -s formatOptions 82 --resampleWidth 600 /tmp/ice.png --out public/images/work/ice-friends-breaker.jpg
sips -g pixelWidth -g pixelHeight public/images/work/*.jpg
```

Expected: `apexflow.jpg` 1600 × 1011 e `ice-friends-breaker.jpg` 600 × 1299 (se l'altezza differisce di qualche pixel, aggiorna `height` in entrambi i file di contenuto).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add full bilingual content model with case studies, experience and side quests"
```
(con le due righe di chiusura delle Global Constraints)

---

### Task 2: Sezione "Selected work" con immagini

**Files:**
- Create: `src/app/sections/work-list/work-list.ts`, `src/app/sections/work-list/work-list.spec.ts`
- Modify: `src/app/pages/home/home.ts`, `src/locale/messages.it.xlf`

**Interfaces:**
- Consumes: `Project` (Task 1).
- Produces: `<app-work-list [projects]="…" />` (`WorkList`, input `projects: readonly Project[]`).

- [ ] **Step 1: Test (RED)** — `src/app/sections/work-list/work-list.spec.ts`

```ts
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CONTENT_EN } from '../../content/content.en';
import { WorkList } from './work-list';

describe('WorkList', () => {
  async function render() {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(WorkList);
    fixture.componentRef.setInput('projects', CONTENT_EN.projects);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('renders one item per project with a link to its case study', async () => {
    const el = await render();
    const links = [...el.querySelectorAll('h3 a')].map((a) => a.getAttribute('href'));
    expect(links).toEqual(['/work/apexflow', '/work/ice-friends-breaker', '/work/mcp-server', '/work/telegram-bots']);
  });

  it('shows an image with alt text only for projects that have one', async () => {
    const el = await render();
    const imgs = [...el.querySelectorAll('img')];
    expect(imgs.map((i) => i.getAttribute('alt'))).toEqual([
      CONTENT_EN.projects[0].image?.alt,
      CONTENT_EN.projects[1].image?.alt,
    ]);
  });

  it('lists the stack of each project', async () => {
    const el = await render();
    expect(el.querySelectorAll('li.project')[0].textContent).toContain('Spring Boot');
  });
});
```

Run: `npx ng test --no-watch --include src/app/sections/work-list/work-list.spec.ts` → FAIL (`Cannot find module './work-list'`).

- [ ] **Step 2: Implementa `src/app/sections/work-list/work-list.ts`**

Layout: una riga per progetto. Da `md` in su testo a sinistra e immagine a destra; le immagini verticali (telefono) restano strette. Niente card con ombre.

```ts
import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Project } from '../../content/content.model';

@Component({
  selector: 'app-work-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NgOptimizedImage],
  template: `
    <ul class="projects">
      @for (project of projects(); track project.slug; let first = $first) {
        <li class="project" [class.project--tall]="project.image && project.image.height > project.image.width">
          <div class="text">
            <h3><a [routerLink]="['/work', project.slug]">{{ project.title }}</a></h3>
            <p>{{ project.summary }}</p>
            <ul class="stack" i18n-aria-label="@@work.stack" aria-label="Technologies">
              @for (tech of project.stack; track tech) {
                <li>{{ tech }}</li>
              }
            </ul>
          </div>
          @if (project.image; as image) {
            <img
              class="shot"
              [ngSrc]="image.src"
              [width]="image.width"
              [height]="image.height"
              [alt]="image.alt"
              [priority]="first"
              sizes="(min-width: 768px) 50vw, 100vw"
            />
          }
        </li>
      }
    </ul>
  `,
  styles: `
    @use 'styles/breakpoints' as bp;

    .projects {
      display: grid;
      gap: var(--space-12);
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .project {
      display: grid;
      gap: var(--space-3);
      align-items: start;
    }
    .text {
      display: grid;
      gap: var(--space-2);
    }
    h3 a {
      color: var(--fg);
    }
    .stack {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-1) var(--space-3);
      margin: 0;
      padding: 0;
      list-style: none;
      color: var(--fg-muted);
      font-size: var(--step--1);
    }
    .shot {
      width: 100%;
      height: auto;
      border: 1px solid var(--rule);
      background: var(--surface);
    }
    .project--tall .shot {
      max-width: 280px;
    }
    @include bp.up(md) {
      .project {
        grid-template-columns: 1fr 1fr;
        gap: var(--space-6);
      }
      .project--tall .shot {
        justify-self: center;
      }
    }
  `,
})
export class WorkList {
  readonly projects = input.required<readonly Project[]>();
}
```

Run il test → PASS (3 test).

- [ ] **Step 3: Usa il componente nella home**

In `src/app/pages/home/home.ts`: importa `WorkList`, sostituisci il blocco `<ul class="projects">…</ul>` della sezione `#work` con `<app-work-list [projects]="content.projects" />` e rimuovi le regole CSS `.projects`, `.projects li`, `.projects a` dalla home.

- [ ] **Step 4: Traduzione e verifica**

`npm run i18n:extract`, poi aggiungi a `src/locale/messages.it.xlf` l'unità `work.stack` con target `Tecnologie` (copia la `<trans-unit>` dal `messages.xlf` estratto e aggiungi `<target>`).

Run: `npm run lint && npx ng test --no-watch && npm run build && npm run e2e`
Expected: tutto verde.

- [ ] **Step 5: Commit** — `feat: add selected work section with project images`

---

### Task 3: Pagina case study completa

**Files:**
- Modify: `src/app/pages/case-study/case-study.ts`, `src/app/pages/case-study/case-study.spec.ts`, `src/locale/messages.it.xlf`

**Interfaces:**
- Consumes: `Project`, `CaseStudyBody`, `Repo` (Task 1).
- Produces: sezioni con `id` stabili: `#context`, `#architecture`, `#decisions`, `#outcome`.

- [ ] **Step 1: Test (RED)** — aggiungi a `case-study.spec.ts`:

```ts
  it('renders the case study sections in order', async () => {
    const el = await render('apexflow');
    const headings = [...el.querySelectorAll('h2')].map((h) => h.textContent?.trim());
    expect(headings).toEqual(['Context', 'How it is built', 'Key decisions', 'Outcome']);
    expect(el.querySelectorAll('#decisions h3')).toHaveLength(3);
  });

  it('labels each repository link', async () => {
    const el = await render('apexflow');
    const labels = [...el.querySelectorAll('.links a')].map((a) => a.textContent?.trim());
    expect(labels).toEqual(['Open the live demo', 'Front-end code', 'Back-end code']);
  });

  it('shows no demo button for a project without a demo', async () => {
    const el = await render('mcp-server');
    expect(el.querySelector('.links .button--primary')).toBeNull();
    expect(el.querySelector('img')).toBeNull();
  });
```

e cambia il test esistente che cerca il link della demo in modo che resti valido.

Run → FAIL (nessun `h2`).

- [ ] **Step 2: Riscrivi il template di `CaseStudy`**

```html
<article class="container case-study">
  @if (project(); as p) {
    <header class="intro">
      <h1>{{ p.title }}</h1>
      <p class="summary">{{ p.summary }}</p>
      <ul class="stack" i18n-aria-label="@@case.stack" aria-label="Technologies">
        @for (tech of p.stack; track tech) {
          <li>{{ tech }}</li>
        }
      </ul>
      <p class="links">
        @if (p.demoUrl) {
          <a class="button button--primary" [href]="p.demoUrl" i18n="@@case.demo">Open the live demo</a>
        }
        @for (repo of p.repos; track repo.url) {
          <a class="button" [href]="repo.url">{{ repo.label }}</a>
        }
      </p>
    </header>

    @if (p.image; as image) {
      <img class="shot" [ngSrc]="image.src" [width]="image.width" [height]="image.height" [alt]="image.alt" priority />
    }

    <section id="context" aria-labelledby="context-title">
      <h2 id="context-title" i18n="@@case.context">Context</h2>
      <p>{{ p.caseStudy.context }}</p>
    </section>

    <section id="architecture" aria-labelledby="architecture-title">
      <h2 id="architecture-title" i18n="@@case.architecture">How it is built</h2>
      <ul class="bullets">
        @for (item of p.caseStudy.architecture; track item) {
          <li>{{ item }}</li>
        }
      </ul>
    </section>

    <section id="decisions" aria-labelledby="decisions-title">
      <h2 id="decisions-title" i18n="@@case.decisions">Key decisions</h2>
      @for (decision of p.caseStudy.decisions; track decision.title) {
        <h3>{{ decision.title }}</h3>
        <p>{{ decision.body }}</p>
      }
    </section>

    <section id="outcome" aria-labelledby="outcome-title">
      <h2 id="outcome-title" i18n="@@case.outcome">Outcome</h2>
      <p>{{ p.caseStudy.outcome }}</p>
    </section>

    <p class="back"><a routerLink="/" fragment="work" i18n="@@case.back">See all projects</a></p>
  } @else {
    <h1 i18n="@@case.notFound">Project not found</h1>
    <p><a routerLink="/" i18n="@@notFound.home">Go to the home page</a></p>
  }
</article>
```

Aggiungi `NgOptimizedImage` agli `imports`. Stili (SCSS inline): `.case-study { display: grid; gap: var(--space-8); padding-block: var(--space-12); }`, `section { display: grid; gap: var(--space-3); }`, `h2 { font-size: var(--step-3); }`, `h3 { font-size: var(--step-1); margin-top: var(--space-2); }`, `.bullets { display: grid; gap: var(--space-2); max-width: var(--measure); padding-left: var(--space-3); }`, `.shot { width: 100%; height: auto; border: 1px solid var(--rule); }` e, per le immagini verticali, `max-width: 360px` tramite `[class.shot--tall]="image.height > image.width"`. Mantieni `.summary`, `.stack`, `.links` del Piano 1.

Run il test → PASS.

- [ ] **Step 3: Traduzioni** — `npm run i18n:extract`, poi in `messages.it.xlf`: `case.context` → `Contesto`, `case.architecture` → `Come è costruito`, `case.decisions` → `Scelte chiave`, `case.outcome` → `Risultato`, `case.back` → `Tutti i progetti`. Rimuovi l'unità `case.repo` (non più usata) se l'estrazione non la contiene più.

- [ ] **Step 4: Verifica e commit**

Run: `npm run lint && npx ng test --no-watch && npm run build && npm run e2e`
Commit: `feat: render full case studies with context, architecture, decisions and outcome`

---

### Task 4: About con "At a glance", esperienza, side quests e stack

**Files:**
- Create: `src/app/sections/at-a-glance/at-a-glance.ts`, `src/app/sections/experience-timeline/experience-timeline.ts`, `src/app/sections/experience-timeline/experience-timeline.spec.ts`, `src/app/sections/side-quests/side-quests.ts`, `src/app/sections/stack-list/stack-list.ts`, `src/app/sections/stack-list/stack-list.spec.ts`
- Modify: `src/app/pages/home/home.ts`, `src/app/layout/site-header.ts`, `src/locale/messages.it.xlf`, `e2e/pages.spec.ts`

**Interfaces:**
- Consumes: `GlanceItem`, `ExperienceItem`, `SideQuest`, `StackGroup` (Task 1).
- Produces: `<app-at-a-glance [items]>`, `<app-experience-timeline [items]>`, `<app-side-quests [items]>`, `<app-stack-list [groups]>`; nuove sezioni della home con id `#experience`, `#side-quests`, `#stack`; ordine finale delle sezioni: hero, work, side-quests, about (con glance), experience, stack, contact.

- [ ] **Step 1: Test della timeline (RED)** — `experience-timeline.spec.ts`

```ts
import { TestBed } from '@angular/core/testing';
import { CONTENT_EN } from '../../content/content.en';
import { ExperienceTimeline } from './experience-timeline';

describe('ExperienceTimeline', () => {
  it('renders an ordered list, newest first, with the period before the title', async () => {
    const fixture = TestBed.createComponent(ExperienceTimeline);
    fixture.componentRef.setInput('items', CONTENT_EN.experience);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const items = [...el.querySelectorAll('ol > li')];
    expect(items).toHaveLength(CONTENT_EN.experience.length);
    expect(items[0].querySelector('.period')?.textContent?.trim()).toBe('2026 – present');
    const text = items[0].textContent ?? '';
    expect(text.indexOf('2026 – present')).toBeLessThan(text.indexOf('Software Engineer'));
  });
});
```

- [ ] **Step 2: Test dello stack (RED)** — `stack-list.spec.ts`

```ts
import { TestBed } from '@angular/core/testing';
import { CONTENT_EN } from '../../content/content.en';
import { StackList } from './stack-list';

describe('StackList', () => {
  it('renders each group as a titled list', async () => {
    const fixture = TestBed.createComponent(StackList);
    fixture.componentRef.setInput('groups', CONTENT_EN.stack);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect([...el.querySelectorAll('h3')].map((h) => h.textContent?.trim())).toEqual(CONTENT_EN.stack.map((g) => g.name));
    expect(el.querySelectorAll('ul li')).toHaveLength(CONTENT_EN.stack.reduce((n, g) => n + g.items.length, 0));
  });
});
```

Run entrambi → FAIL (moduli mancanti).

- [ ] **Step 3: Componenti**

`experience-timeline.ts`:

```ts
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ExperienceItem } from '../../content/content.model';

@Component({
  selector: 'app-experience-timeline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ol class="timeline">
      @for (item of items(); track item.title + item.org) {
        <li>
          <p class="period">{{ item.period }}</p>
          <h3>{{ item.title }}<span class="org">, {{ item.org }}</span></h3>
          <p>{{ item.summary }}</p>
        </li>
      }
    </ol>
  `,
  styles: `
    @use 'styles/breakpoints' as bp;

    .timeline {
      display: grid;
      gap: var(--space-6);
      margin: 0;
      padding: 0 0 0 var(--space-3);
      list-style: none;
      border-left: 2px solid var(--rule);
    }
    li {
      display: grid;
      gap: var(--space-1);
    }
    .period {
      color: var(--fg-muted);
      font-size: var(--step--1);
    }
    h3 {
      font-size: var(--step-1);
    }
    .org {
      font-weight: 400;
    }
    @include bp.up(md) {
      li {
        grid-template-columns: 12rem 1fr;
        column-gap: var(--space-4);
      }
      .period {
        grid-row: span 2;
        padding-top: 0.2em;
      }
    }
  `,
})
export class ExperienceTimeline {
  readonly items = input.required<readonly ExperienceItem[]>();
}
```

`stack-list.ts`:

```ts
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { StackGroup } from '../../content/content.model';

@Component({
  selector: 'app-stack-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="groups">
      @for (group of groups(); track group.name) {
        <div class="group">
          <h3>{{ group.name }}</h3>
          <ul>
            @for (item of group.items; track item) {
              <li>{{ item }}</li>
            }
          </ul>
        </div>
      }
    </div>
  `,
  styles: `
    @use 'styles/breakpoints' as bp;

    .groups {
      display: grid;
      gap: var(--space-6);
    }
    .group {
      display: grid;
      gap: var(--space-2);
    }
    h3 {
      font-size: var(--step-1);
    }
    ul {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-1) var(--space-3);
      margin: 0;
      padding: 0;
      list-style: none;
    }
    @include bp.up(md) {
      .groups {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `,
})
export class StackList {
  readonly groups = input.required<readonly StackGroup[]>();
}
```

`at-a-glance.ts` (lista di definizioni, utile anche agli agenti AI, spec §9):

```ts
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { GlanceItem } from '../../content/content.model';

@Component({
  selector: 'app-at-a-glance',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dl class="glance">
      @for (item of items(); track item.label) {
        <div>
          <dt>{{ item.label }}</dt>
          <dd>{{ item.value }}</dd>
        </div>
      }
    </dl>
  `,
  styles: `
    @use 'styles/breakpoints' as bp;

    .glance {
      display: grid;
      gap: var(--space-2);
      margin: 0;
      padding: var(--space-3);
      background: var(--surface);
    }
    div {
      display: grid;
      gap: 2px;
    }
    dt {
      color: var(--fg-muted);
      font-size: var(--step--1);
    }
    dd {
      margin: 0;
    }
    @include bp.up(md) {
      .glance {
        grid-template-columns: repeat(2, 1fr);
        column-gap: var(--space-4);
      }
    }
  `,
})
export class AtAGlance {
  readonly items = input.required<readonly GlanceItem[]>();
}
```

`side-quests.ts`:

```ts
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SideQuest } from '../../content/content.model';

@Component({
  selector: 'app-side-quests',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="quests">
      @for (quest of items(); track quest.title) {
        <li>
          <h3>{{ quest.title }}</h3>
          <p>{{ quest.summary }}</p>
          <p class="tags">{{ quest.tags.join(', ') }}</p>
        </li>
      }
    </ul>
  `,
  styles: `
    @use 'styles/breakpoints' as bp;

    .quests {
      display: grid;
      gap: var(--space-4);
      margin: 0;
      padding: 0;
      list-style: none;
    }
    li {
      display: grid;
      gap: var(--space-1);
      align-content: start;
      padding-top: var(--space-2);
      border-top: 2px solid var(--fg);
    }
    h3 {
      font-size: var(--step-1);
    }
    .tags {
      color: var(--fg-muted);
      font-size: var(--step--1);
    }
    @include bp.up(md) {
      .quests {
        grid-template-columns: repeat(3, 1fr);
      }
    }
  `,
})
export class SideQuests {
  readonly items = input.required<readonly SideQuest[]>();
}
```

Run i test → PASS.

- [ ] **Step 4: Componi la home**

Nuovo ordine delle sezioni in `home.ts` (dopo l'hero e `#work`):

```html
<section id="side-quests" class="section container" aria-labelledby="side-quests-title">
  <h2 id="side-quests-title" i18n="@@home.sideQuests.title">Side quests</h2>
  <p class="muted" i18n="@@home.sideQuests.lede">Things I build for fun, from crosswords to 3D-printed parts.</p>
  <app-side-quests [items]="content.sideQuests" />
</section>

<section id="about" class="section container" aria-labelledby="about-title">
  <h2 id="about-title" i18n="@@home.about.title">About</h2>
  <p>{{ content.about }}</p>
  <app-at-a-glance [items]="content.glance" />
</section>

<section id="experience" class="section container" aria-labelledby="experience-title">
  <h2 id="experience-title" i18n="@@home.experience.title">Experience</h2>
  <app-experience-timeline [items]="content.experience" />
</section>

<section id="stack" class="section container" aria-labelledby="stack-title">
  <h2 id="stack-title" i18n="@@home.stack.title">Tools I use</h2>
  <app-stack-list [groups]="content.stack" />
</section>
```

Poi la sezione `#contact` invariata. Aggiungi i quattro componenti agli `imports`. Nell'header aggiungi la voce `Experience` (`fragment="experience"`, `i18n="@@nav.experience"`) tra About e Contact.

- [ ] **Step 5: Traduzioni**

`npm run i18n:extract`, poi in `messages.it.xlf`: `home.sideQuests.title` → `Side quest`, `home.sideQuests.lede` → `Cose che costruisco per divertimento, dai cruciverba ai pezzi stampati in 3D.`, `home.experience.title` → `Esperienza`, `home.stack.title` → `Strumenti che uso`, `nav.experience` → `Esperienza`.

- [ ] **Step 6: Verifica e commit**

Run: `npm run lint && npx ng test --no-watch && npm run build && npm run e2e`
Controllo visivo con Playwright (script di screenshot del Piano 1, Task 5) a 375 e 1440 px, light e dark: niente righe lunghe oltre 68 caratteri, timeline leggibile, griglia delle side quest allineata.

Commit: `feat: add about glance, experience timeline, side quests and stack sections`

---

### Task 5: Test end-to-end dei contenuti

**Files:**
- Modify: `e2e/pages.spec.ts`, `e2e/layout.spec.ts`

**Interfaces:**
- Consumes: pagine dei Task 2–4.
- Produces: copertura e2e di tutti i case study, delle immagini e delle sezioni.

- [ ] **Step 1: Estendi le pagine controllate**

In `e2e/pages.spec.ts` sostituisci `PAGES` con tutte le pagine prerenderizzate:

```ts
const SLUGS = ['apexflow', 'ice-friends-breaker', 'mcp-server', 'telegram-bots'];
const PAGES = ['/en/', '/it/', ...SLUGS.flatMap((s) => [`/en/work/${s}`, `/it/work/${s}`]), '/en/404', '/it/404'];
```

- [ ] **Step 2: Immagini caricate in entrambe le lingue (Review Focus #4)**

Aggiungi:

```ts
for (const locale of ['en', 'it']) {
  test(`project images load in the ${locale} build`, async ({ page }) => {
    await page.goto(`/${locale}/`);
    const images = page.locator('#work img');
    await expect(images).toHaveCount(2);
    for (const img of await images.all()) {
      await img.scrollIntoViewIfNeeded();
      await expect.poll(() => img.evaluate((el) => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    }
  });
}

test('the home page has every section in order', async ({ page }) => {
  await page.goto('/en/');
  const ids = await page.locator('main section[id]').evaluateAll((els) => els.map((e) => e.id));
  expect(ids).toEqual(['work', 'side-quests', 'about', 'experience', 'stack', 'contact']);
});
```

- [ ] **Step 3: Overflow su tutte le pagine (Review Focus #1)**

In `e2e/layout.spec.ts` cambia la lista dei percorsi in `['/en/', '/it/', '/en/work/apexflow', '/it/work/telegram-bots', '/it/work/mcp-server']`.

- [ ] **Step 4: Esegui e commit**

Run: `npm run build && npm run e2e && npm run lhci`
Expected: tutto verde; Lighthouse Performance ≥ 0.95 anche con le immagini (se scende, verifica che l'immagine di ApexFlow abbia `priority` e `sizes` corretti).

Commit: `test: cover every case study, project images and section order end to end`

---

### Fine piano

- [ ] `npm run lint && npx ng test --no-watch && npm run test:scripts && npm run build && npm run e2e && npm run lhci` tutto verde.
- [ ] Push del branch `v2` e CI di GitHub verde.
