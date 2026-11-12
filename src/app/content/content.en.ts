import type { SiteContent } from './content.model';

export const CONTENT_EN: SiteContent = {
  person: {
    name: 'Emanuele Del Monte',
    role: 'Frontend Engineer',
    employer: 'IPS S.p.A.',
    location: 'Latina, Italy',
    email: 'info@emanueledelmonte.it',
    linkedin: 'https://www.linkedin.com/in/emanueledelmonte/',
    github: 'https://github.com/xdelmo',
    knowsAbout: ['Angular', 'Angular Signals', 'RxJS', 'TypeScript', 'NgRx', 'PrimeNG', 'Spring Boot', 'Model Context Protocol', 'AI-assisted development'],
    summary:
      'Emanuele Del Monte is a Frontend Engineer in Latina, Italy, who builds enterprise Angular frontends with Signals, RxJS and NgRx.',
  },
  seo: {
    title: 'Emanuele Del Monte — Angular Frontend Engineer',
    description:
      'I build Angular interfaces that stay fast when the data gets big. Frontend Engineer at IPS S.p.A. in Aprilia, Italy.',
  },
  hero: {
    headline: 'Engineer by method, curious by nature',
    voice: 'curious by nature',
    lede: "I'm Emanuele, Frontend Engineer at IPS S.p.A. I\u00a0build Angular interfaces that stay fast when the data gets big, and I\u00a0leave an easter egg for whoever looks closely.",
    peek: 'closely',
  },
  aboutStatement: 'A table with thousands of rows should feel like one with ten.',
  aboutVoice: 'like one with ten.',
  about: [
    'I started building web frontends in 2022 at a web agency: CRMs, e-commerce sites and Flexie, a B2B packaging configurator. In 2026 I joined IPS S.p.A. as an intern, wrote my thesis there and stayed on the product team of an intelligence platform. The thesis, ApexFlow, is a full-stack CRM dashboard in Angular and Spring Boot.',
    "Claude Code is part of my day: I use it to write and review code, draft tests, find my way around new APIs and keep documentation up to date. I also studied how language models reach real tools and data, and built an MCP server to try it.",
  ],
  figures: [
    { value: '€1M', label: 'in orders placed through the Flexie configurator I built' },
    { value: '20', label: 'legacy components moved to Signals' },
    { value: '450', label: 'pages in six languages, in the in-app help I built' },
    { value: '40', label: 'countries using the IPS platform I work on' },
  ],
  glance: [
    { label: 'Role', value: 'Frontend Engineer, Angular specialist' },
    { label: 'Based in', value: 'Latina, Italy (remote-friendly)' },
    { label: 'Experience', value: 'Building web frontends since 2022' },
    { label: 'Main stack', value: 'Angular, Signals, RxJS, NgRx, TypeScript' },
    { label: 'Education', value: 'BSc in Computer Engineering, Università Mercatorum, 2026' },
    { label: 'Languages', value: 'Italian (native), English (professional)' },
  ],
  projects: [
    {
      slug: 'apexflow',
      title: 'ApexFlow',
      role: 'My Computer Engineering thesis, built during my internship at IPS S.p.A. in 2026.',
      result: 'One API call per filter change, on every table.',
      summary:
        'A CRM and analytics dashboard whose tables sort, filter and page on the server, with every view saved in the URL.',
      stack: ['Angular', 'Signals', 'RxJS', 'PrimeNG', 'Tailwind CSS', 'Spring Boot', 'PostgreSQL'],
      repos: [
        { label: 'Frontend code', url: 'https://github.com/xdelmo/dashboard-tesi' },
      ],
      demoUrl: 'https://dashboard-tesi.vercel.app/welcome',
      image: {
        src: 'images/work/apexflow.webp',
        alt: 'The orders page of the ApexFlow dashboard: a table of order IDs, dates, customers, service types, totals and payment statuses, with sorting, filters and pagination, beside the navigation sidebar',
        width: 1536,
        height: 1024,
      },
      caseStudy: {
        context:
          'For my Computer Engineering thesis, I focused on real-world enterprise architecture challenges. ApexFlow models a SaaS platform that a tech company would use to manage customers, subscriptions, products, and orders, designed around the performance, security, and maintainability constraints of a production system.',
        architecture: [
          'Angular 19 single-page application with standalone components and reactive state management powered by Signals.',
          'PrimeNG design system for data-dense UI: lazy-loading data tables, reactive forms, modal dialogs, and toast notifications.',
          'Role-based access control (RBAC) with synchronous route guards protecting admin configurations and sensitive user profile views.',
          'Centralized HTTP interceptors attaching JWT Bearer tokens and transforming API error responses into unified toast notifications.',
          'Spring Boot 3 REST API on Java 21 with Spring Data JPA, containerized PostgreSQL via Docker, deployed across Vercel (frontend) and Render (backend).',
        ],
        decisions: [
          {
            title: 'Signals for state, RxJS where time matters',
            body: 'Authentication state resides in signals, eliminating manual subscriptions and memory leaks across component lifecycles. RxJS remains focused on its core strength: debouncing search inputs and automatically cancelling stale HTTP requests via switchMap.',
          },
          {
            title: 'Server-side tables with one reusable state class',
            body: 'The TablePaginationState class encapsulates pagination, sorting, and filter state in the URL, bridging signals and observables via toSignal and toObservable. Deep equality checks prevent redundant API requests on unchanged filters, enabling every table in the app to share the same deterministic logic.',
          },
          {
            title: 'Spring Boot instead of a JavaScript backend',
            body: 'NestJS would have kept the entire stack in TypeScript, but Spring Boot represents the dominant enterprise standard alongside Angular. Managing two separate runtimes enforced strict interface boundaries: JPA persistence entities never bleed into presentation components, making every field in the REST contract an intentional decision.',
          },
        ],
        outcome:
          'I graduated in April 2026 with ApexFlow as my thesis project. The live demo on Vercel includes one-click credentials to test both administrator and standard user workflows.',
      },
    },
    {
      slug: 'pokeverba',
      sprite: 'crossword',
      title: 'PokèVerba',
      role: 'A side project with a friend who writes the content; I build and run the site. 2026.',
      result: 'A daily crossword whose answers never reach the browser.',
      summary: 'A daily Pokémon crossword with a collection of the Pokémon you catch and a blog, in Italian and English.',
      stack: ['WordPress', 'PHP', 'React', 'Vite'],
      repos: [{ label: 'Code on GitHub', url: 'https://github.com/xdelmo/pokeverba-site' }],
      demoUrl: 'https://sbustiamobro.it',
      image: {
        src: 'images/work/pokeverba.webp',
        alt: "PokèVerba's daily Pokémon crossword with two words filled in: the grid, the across and down clues, the region tabs and the catch streak, caught and token counters",
        width: 1536,
        height: 1024,
      },
      caseStudy: {
        context:
          'A daily Pokémon crossword playable in the browser. Operating as an independent commercial platform with ads and affiliate links, strict trademark constraints prevent the use of any official Nintendo or Pokémon Company art or text—requiring all clues to be procedurally generated from raw data.',
        architecture: [
          'Hybrid architecture: custom WordPress theme for core pages, backed by a dedicated plugin exposing REST APIs, custom database tables, and WP-CLI commands.',
          'Interactive React application built with Vite and mounted via shortcode, powering the crossword grid, Pokémon catch collection, and achievement system.',
          'Server-side generation algorithm laying out 10 to 15 words across a matrix up to 15 × 15, seeded daily with a 30-day anti-repetition window.',
          'Bilingual localization (Italian and English) without translation plugins, storing player streaks and progress in local storage.',
        ],
        decisions: [
          {
            title: 'The answers never reach the browser',
            body: 'The browser receives only word lengths and grid topology. Validation happens server-side through a REST endpoint that evaluates complete words: players cannot inspect network traffic or client memory to extract puzzle solutions.',
          },
          {
            title: 'Original clues composed from facts',
            body: 'The generation engine synthesizes original clues by combining taxonomic attributes (type, generation, physical stats) from PokéAPI, programmatically discarding any string that mentions the target species or mirrors official trademarked copy.',
          },
          {
            title: 'One puzzle a day, cached until midnight',
            body: "Today's puzzle is generated once and cached until midnight (Rome timezone), reducing server computation to a single daily execution per language.",
          },
        ],
        outcome: 'Live at sbustiamobro.it and at version 1.18 in October 2026, with a regional crossword, coins and achievements.',
      },
    },
    {
      slug: 'wedding-3d-invite',
      title: 'Wedding 3D Invite',
      role: 'Designed and built on my own in 2026, for the wedding of two friends.',
      result: 'A wedding invitation that opens like a real envelope, then stops using the GPU.',
      summary:
        'A mobile-first digital wedding invitation: a lace envelope in Three.js that opens at a tap, then the day told in eleven slides, with RSVP and offline support.',
      stack: ['React', 'TypeScript', 'Three.js', 'Tailwind CSS', 'Vite'],
      repos: [{ label: 'Code on GitHub', url: 'https://github.com/xdelmo/wedding-3d-invite' }],
      demoUrl: 'https://wedding-3d-invite-demo-five.vercel.app/',
      image: {
        src: 'images/work/wedding-invite.webp',
        alt: 'The closed invitation up close: a lace envelope scattered with pearls, sealed with a burgundy wax seal engraved G&L',
        width: 1536,
        height: 1024,
      },
      caseStudy: {
        context:
          'Two friends of mine wanted their paper wedding invitation, in lace and pearls, rebuilt for the smartphone their guests already hold. The experience had to replicate the tactile feeling of opening a physical envelope, while providing a comprehensive ceremony guide: countdown, interactive maps, dress code, and an offline RSVP flow.',
        architecture: [
          'Mobile-first single-page application in React and TypeScript with Tailwind CSS; desktop viewports are framed inside a phone mockup to maintain intended visual proportions.',
          'Interactive 3D Three.js scene featuring opening lace flaps, a custom engraved wax seal, and physically based rendering (PBR) shaders for realistic pearl reflections.',
          'Full-screen vertical navigation driven by CSS scroll snap (dvh), snapping each ceremony section seamlessly to the viewport.',
          'Serverless RSVP architecture forwarding guest responses directly to Google Sheets via Google Apps Script; PWA service worker caching ensures offline reliability.',
        ],
        decisions: [
          {
            title: 'Every word of the invitation in one config file',
            body: 'All ceremony details, schedule data, and RSVP endpoints live in a single typed TypeScript configuration. The public demo uses anonymized sample data while the private production deployment houses real wedding details, powering Open Graph, event JSON-LD, and PWA manifest from one source.',
          },
          {
            title: 'The 3D scene stops once the envelope is open',
            body: 'Once the envelope opening animation completes, the Three.js requestAnimationFrame loop completely freezes. Reading the ceremony slides draws zero continuous GPU or battery power, with a footer control available to replay the 3D sequence on demand.',
          },
          {
            title: 'One palette, with contrast under test',
            body: 'The burgundy and ivory palette propagates consistently across Three.js materials, Tailwind classes, and SVG icons. Automated unit tests enforce WCAG 2.2 AA color contrast ratios across all text and surface combinations before building.',
          },
        ],
        outcome:
          'The real invitation belongs to my friends and stays private; the public demo on Vercel shows the same invitation with sample names.',
      },
    },
  ],
  experience: [
    {
      period: '2022 – 2024',
      short: 'Frontend Developer',
      title: 'Frontend Developer',
      org: 'Web agency',
      summary: 'About two years building CRMs, single-page apps and e-commerce sites for clients.',
      highlights: [
        'Built Flexie, a B2B configurator for flexible packaging: more than 100 combinations of materials, formats and accessories, priced in real time.',
        'Wrote custom WordPress plugins for e-commerce sites and wired third-party REST APIs into them.',
      ],
      tags: ['Angular', 'Next.js', 'WordPress', 'PHP'],
    },
    {
      period: '2026',
      short: 'Intern',
      title: 'Software engineering intern',
      org: 'IPS S.p.A.',
      summary: 'Joined the frontend team while finishing my degree.',
      highlights: [
        'Built ApexFlow, a CRM dashboard with server-side tables, in Angular 19 with Signals.',
        'Added server-side filtering, pagination, role-based permissions and unit tests.',
      ],
      tags: ['Angular', 'Signals', 'RxJS', 'PrimeNG', 'Tailwind CSS'],
      caseStudy: { slug: 'apexflow', label: 'ApexFlow case study' },
    },
    {
      period: '2026 – present',
      short: 'Frontend Specialist',
      title: 'Software Engineer, Frontend Specialist',
      org: 'IPS S.p.A.',
      summary: 'On the product team of an enterprise intelligence platform.',
      highlights: [
        'Moved over 20 legacy components to Signals during the upgrade to Angular 22.',
        'Built in-app help: over 450 pages in six languages, linked from 100+ fields.',
      ],
      tags: ['Angular', 'Signals', 'RxJS', 'NgRx', 'Kendo UI'],
    },
  ],
  studies: [
    {
      sprite: 'cap',
      period: '2026',
      title: 'BSc in Computer Engineering',
      org: 'Università Mercatorum',
      summary: 'Graduated in April 2026 with ApexFlow, a full-stack CRM dashboard in Angular and Spring Boot.',
      caseStudy: { slug: 'apexflow', label: 'ApexFlow case study' },
    },
    {
      sprite: 'trophy',
      period: '2025',
      title: 'Agile Masterclass',
      org: 'Joinrs',
      summary: 'Two sessions, the Agile mindset and then Scrum and Kanban, closed by a quiz I won.',
    },
    {
      sprite: 'terminal',
      period: '2026',
      title: 'Claude Code and MCP courses',
      org: 'Anthropic Academy',
      summary: 'Claude Code 101, Claude Code in Action, Introduction to Model Context Protocol, its advanced topics, and AI Fluency.',
    },
  ],
  privacy: {
    updated: 'Last updated: 10 October 2026',
    intro:
      'This site is my personal portfolio. It loads only its own scripts, without analytics or ads, and keeps in your browser only what it needs to remember your choices.',
    sections: [
      {
        heading: 'Who is responsible',
        paragraphs: ['Emanuele Del Monte is the data controller. For anything about your data, write to info@emanueledelmonte.it.'],
      },
      {
        heading: 'What the site keeps in your browser',
        paragraphs: [
          'The nf_lang cookie remembers the language you chose with the language switch, so the home page opens in it next time. It lasts one year and is sent to the server only to pick the language.',
          'Two entries in local storage: theme remembers whether you chose the light or the dark theme, explored which case studies you have read, for an achievement in the site\'s hidden game.',
          'Three entries in session storage (intro, motion pause and the language curtain) remember, until you close the tab, whether the opening intro was already shown, whether you paused the animations and which language you are switching to.',
          'These are technical preferences: they identify nobody, are never shared and need no consent. You can delete them at any time from your browser settings.',
        ],
      },
      {
        heading: 'Hosting',
        paragraphs: [
          'The site is hosted by Netlify, Inc. Like every web server, it processes the technical data of each request (IP address, browser, page and time) to deliver the pages and keep the service secure. I rely on my legitimate interest in running the site. Netlify is based in the United States, and its data processing agreement covers transfers outside the EU.',
        ],
      },
      {
        heading: 'If you write to me',
        paragraphs: [
          'If you email me, I use your address and your message only to reply, and keep them as long as the conversation needs. I never share them.',
        ],
      },
      {
        heading: 'Links to other sites',
        paragraphs: ['Links to GitHub, LinkedIn and the project demos take you to sites with their own privacy policies.'],
      },
      {
        heading: 'Your rights',
        paragraphs: [
          'You can ask to access, correct or delete your data, to restrict or object to its processing, and to receive it in a portable format (GDPR, articles 15 to 21): write to info@emanueledelmonte.it. You can also lodge a complaint with the Italian data protection authority, the Garante per la protezione dei dati personali (garanteprivacy.it).',
        ],
      },
    ],
  },
  sideQuests: [
    {
      title: 'Telegram bots',
      summary: 'Three bots I use every day, each answering only to me: car deadlines, my Pokémon card binder and attendance timesheets.',
      tags: ['TypeScript', 'Python', 'grammY', 'SQLite'],
      sprite: 'robot',
    },
    {
      title: 'MagSafe card holder',
      summary: 'A 3D-printed holder for one Pokémon card on the back of an iPhone, modelled entirely in Python code with automatic fit checks.',
      tags: ['Python', 'build123d', '3D printing'],
      repo: 'https://github.com/xdelmo/magsafe-cardholder',
      sprite: 'cardholder',
    },
    {
      title: 'Volkswagen Up storage tray',
      summary: 'A parametric insert for the door armrest of my car, with a pipeline that goes from code to a ready-to-print file in one command.',
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
      // what the rest of the site does not say: the old About, the GitHub profile, a LinkedIn post
      { title: 'Drummer', detail: 'More than ten years behind the kit', sprite: 'drum' },
      { title: 'Hardcore raider', detail: 'World of Warcraft: teamwork is my daily bread', sprite: 'sword' },
      { title: 'Team pizza', detail: 'If I could eat one thing forever', sprite: 'pizza' },
    ],
    cheat: { title: 'Konami code', detail: '↑ ↑ ↓ ↓ ← → ← → B A', sprite: 'trophy' },
  },
  // levels, from the middle out (piano 12): what I use every day, what runs in production, what I try on my own
  stack: [
    { name: 'Every day', items: ['Angular', 'Signals', 'RxJS', 'NgRx', 'TypeScript', 'SCSS', 'Claude Code'] },
    { name: 'In production', items: ['Spring Boot', 'Java', 'PostgreSQL', 'Docker', 'Node.js', 'Vitest', 'Playwright', 'ESLint', 'Git'] },
    { name: 'In side projects', items: ['Next.js', 'React', 'Supabase', 'Tailwind CSS', 'Flutter', 'Python', 'MCP'] },
  ],
};
