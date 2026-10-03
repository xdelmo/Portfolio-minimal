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
    'I work on enterprise front ends: large tables, server-side filtering, state that has to stay predictable. My thesis, ApexFlow, is a full-stack CRM dashboard built with Angular Signals and Spring Boot.',
  projects: [
    {
      slug: 'apexflow',
      title: 'ApexFlow',
      summary: 'A CRM and analytics dashboard: Angular 19 with Signals and RxJS on the front end, Spring Boot 3 and PostgreSQL on the back end.',
      stack: ['Angular', 'Signals', 'RxJS', 'PrimeNG', 'Spring Boot', 'PostgreSQL'],
      repoUrls: ['https://github.com/xdelmo/dashboard-tesi', 'https://github.com/xdelmo/backend-tesi'],
      demoUrl: 'https://dashboard-tesi.vercel.app/welcome',
    },
    {
      slug: 'ice-friends-breaker',
      title: 'Ice Friends Breaker',
      summary: 'A social card game to break the ice, installable on phones as a PWA and native app.',
      stack: ['Next.js', 'Supabase', 'Tailwind CSS', 'Capacitor'],
      repoUrls: ['https://github.com/xdelmo/ice-friends-breaker'],
      demoUrl: 'https://ice-friends-breaker.vercel.app',
    },
    {
      slug: 'mcp-server',
      title: 'MCP Server',
      summary: 'A Model Context Protocol server and client that lets an LLM read and edit documents through custom tools.',
      stack: ['Python', 'MCP'],
      repoUrls: ['https://github.com/xdelmo/mcp-server'],
    },
    {
      slug: 'telegram-bots',
      title: 'Telegram bots',
      summary: 'Three bots I use every day: car deadlines, my Pokémon TCG binder and attendance timesheets.',
      stack: ['TypeScript', 'Python', 'Telegram Bot API'],
      repoUrls: [
        'https://github.com/xdelmo/auto-scadenze-bot',
        'https://github.com/xdelmo/hoenn-binder',
        'https://github.com/xdelmo/presenz-lazy-bot',
      ],
    },
  ],
};
