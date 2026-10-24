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
      'Emanuele Del Monte is a Frontend Engineer in Latina, Italy, who builds enterprise Angular front ends with Signals, RxJS and NgRx.',
  },
  seo: {
    title: 'Emanuele Del Monte — Angular Frontend Engineer',
    description:
      'I build Angular interfaces that stay fast when the data gets big. Frontend Engineer at IPS S.p.A. in Latina, Italy.',
  },
  hero: {
    headline: 'I build Angular interfaces that stay fast when the data gets big.',
    lede: "I'm Emanuele Del Monte, Frontend Engineer at IPS S.p.A., based in Latina, Italy. Computer Engineering graduate.",
  },
  aboutStatement: 'I care about the parts users never see but always feel.',
  about: [
    "I'm Emanuele Del Monte, a Frontend Engineer based in Latina, Italy. I build enterprise front ends with Angular, Signals and RxJS: large tables that stay responsive, filters that run on the server, state that stays predictable when the app grows. Before IPS I spent about two years at a web agency building CRMs, e-commerce sites and a B2B product configurator. My thesis, ApexFlow, is a full-stack CRM dashboard with an Angular front end and a Spring Boot back end.",
    "Claude Code is part of my day: I use it to write and review code, draft tests, find my way around new APIs and keep documentation up to date. I also studied how language models reach real tools and data, and built an MCP server to try it.",
  ],
  glance: [
    { label: 'Role', value: 'Frontend Engineer, Angular specialist' },
    { label: 'Based in', value: 'Latina, Italy (remote-friendly)' },
    { label: 'Experience', value: 'Building web front ends since 2022' },
    { label: 'Main stack', value: 'Angular, Signals, RxJS, NgRx, TypeScript' },
    { label: 'Education', value: 'BSc in Computer Engineering, Università Mercatorum, 2026' },
    { label: 'Languages', value: 'Italian (native), English (professional)' },
  ],
  projects: [
    {
      slug: 'apexflow',
      title: 'ApexFlow',
      role: 'My Computer Engineering thesis, built during my internship at IPS S.p.A. in 2026.',
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
        alt: 'ApexFlow dashboard with revenue, expense, profit and new-customer totals, a revenue chart and the navigation sidebar',
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
      slug: 'pokeverba',
      sprite: 'crossword',
      title: 'PokèVerba',
      role: 'A side project with Matteo Terenzi, who writes the content; I build and run the site. 2026.',
      summary: 'A daily Pokémon crossword with a collection of the Pokémon you catch and a blog, in Italian and English.',
      stack: ['WordPress', 'PHP', 'React', 'Vite'],
      repos: [{ label: 'Code on GitHub', url: 'https://github.com/xdelmo/pokeverba-site' }],
      demoUrl: 'https://sbustiamobro.it',
      image: {
        src: 'images/work/pokeverba.jpg',
        alt: "PokèVerba's daily Pokémon crossword: the grid, the across and down clues, the region tabs and the catch streak, caught and token counters",
        width: 1600,
        height: 1011,
      },
      caseStudy: {
        context:
          'A crossword about Pokémon that changes every day, played in the browser. The site will carry ads and affiliate links, so it is a commercial use: no official text or image may appear anywhere, and every clue has to be our own.',
        architecture: [
          'A classic WordPress theme for the whole site (home, blog, pages) and a plugin with its own tables, a REST API and WP-CLI commands.',
          'A React app built with Vite, embedded through a shortcode: the grid, the Collection of caught Pokémon, achievements and coins.',
          'A server-side generator lays out 10 to 15 words in a grid of up to 15 × 15, seeded by the date, with no Pokémon repeated within 30 days.',
          'Italian and English without a multilingual plugin; progress lives in the browser, in local storage.',
        ],
        decisions: [
          {
            title: 'The answers never reach the browser',
            body: 'The app only knows how long each word is. Checking goes through the API, which judges whole words only, so the Check button never gives letters away one at a time.',
          },
          {
            title: 'Original clues composed from facts',
            body: 'Clues are composed from facts such as type, generation, height and weight, imported from PokéAPI, and any clue that names the answer is rejected. No official text is ever copied.',
          },
          {
            title: 'One puzzle a day, cached until midnight',
            body: "Today's puzzle is cached until midnight in Rome, when the next one is generated, so the server does the work once a day.",
          },
        ],
        outcome: 'Live at sbustiamobro.it and at version 1.18 in October 2026, with a regional crossword, coins and achievements.',
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
        'Flexie, a B2B configurator for flexible packaging: more than 100 combinations of materials, formats and accessories, priced in real time.',
        'Custom WordPress plugins for e-commerce sites, and third-party REST APIs wired into them.',
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
        'Built ApexFlow, a dashboard for complex data, in Angular 19 with Signals.',
        'Filtering and pagination over large data sets, role-based permissions, unit tests.',
      ],
      tags: ['Angular', 'Signals', 'RxJS', 'Tailwind CSS'],
      caseStudy: { slug: 'apexflow', label: 'ApexFlow case study' },
    },
    {
      period: '2026 – present',
      short: 'Frontend Specialist',
      title: 'Software Engineer, Frontend Specialist',
      org: 'IPS S.p.A.',
      summary: 'Product team of an enterprise platform for cybersecurity.',
      highlights: [
        'Legacy components moved to Signals, with facades over the NgRx store.',
        'A query builder for advanced filters on big data, in Kendo Grid.',
        'A custom HTML5 video player with search inside its subtitles.',
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
      'This site is my personal portfolio. It has no analytics, no ads, no tracking and no third-party scripts: it only keeps in your browser what it needs to remember your choices.',
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
      { title: 'Phone bricker', detail: 'I bricked so many phones', sprite: 'phone' },
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
