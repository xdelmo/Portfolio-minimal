import { SiteContent } from './content.model';
import { CONTENT_EN } from './content.en';

const [apexflow, iceFriends, mcp, bots] = CONTENT_EN.projects;

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
    'Lavoro su frontend enterprise: tabelle grandi, filtri lato server, stato che deve restare prevedibile. La mia tesi, ApexFlow, è una dashboard CRM full-stack costruita con Angular Signals e Spring Boot.',
  projects: [
    { ...apexflow, summary: 'Una dashboard CRM e di analytics: Angular 19 con Signals e RxJS nel frontend, Spring Boot 3 e PostgreSQL nel backend.' },
    { ...iceFriends, summary: 'Un gioco di carte per rompere il ghiaccio, installabile sul telefono come PWA e come app nativa.' },
    { ...mcp, summary: 'Un server e un client Model Context Protocol che permettono a un LLM di leggere e modificare documenti tramite tool personalizzati.' },
    { ...bots, title: 'Bot Telegram', summary: "Tre bot che uso ogni giorno: scadenze dell'auto, il mio raccoglitore di carte Pokémon e i fogli presenze." },
  ],
};
