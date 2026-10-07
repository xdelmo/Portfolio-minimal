import type { SpriteName } from '../sections/side-quests/sprites';

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
  /** One sentence about me that search engines and AI assistants can quote (JSON-LD description). */
  summary: string;
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
  /** The pixel item shown in the project's frame when there is no screenshot. */
  sprite?: SpriteName;
  caseStudy: CaseStudyBody;
}

/** A job: a card in the deck, with a chapter in the track above it. */
export interface ExperienceItem {
  period: string;
  /** The role in a few words, for the chapter track. */
  short: string;
  title: string;
  org: string;
  summary: string;
  highlights: readonly string[];
  tags: readonly string[];
  /** The related case study, if any. */
  caseStudy?: CaseStudyLink;
}

/** A degree or a certificate: listed under the jobs, never a card. */
export interface StudyItem {
  /** Its pixel item, the same one the player card shows for this achievement. */
  sprite: SpriteName;
  period: string;
  title: string;
  org: string;
  summary: string;
  caseStudy?: CaseStudyLink;
}

export interface CaseStudyLink {
  slug: string;
  /** The link text, naming the project. */
  label: string;
}

export interface Achievement {
  title: string;
  detail: string;
  sprite: SpriteName;
}

export interface Game {
  /** The name on the card: the nickname, not the full name the header already shows. */
  player: string;
  /** About the years of experience. */
  level: number;
  /** The role the experience points lead to. */
  next: string;
  /** Progress towards `next`, from 0 to 1. */
  xp: number;
  achievements: readonly Achievement[];
  /** The extra achievement the Konami code unlocks: the card it opens is the cheat version (level 99, full XP). */
  cheat: Achievement;
}

export interface SideQuest {
  title: string;
  summary: string;
  tags: readonly string[];
  /** The code on GitHub. */
  repo: string;
  /** Its item in the side quests' inventory (sections/side-quests/sprites.ts). */
  sprite: SpriteName;
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
  /** The home page's <title> and meta description: what a search result shows. */
  seo: { title: string; description: string };
  hero: { headline: string; lede: string };
  /** One sentence that opens the About section, in large type. */
  aboutStatement: string;
  about: string;
  glance: readonly GlanceItem[];
  projects: readonly Project[];
  experience: readonly ExperienceItem[];
  studies: readonly StudyItem[];
  privacy: PrivacyContent;
  sideQuests: readonly SideQuest[];
  /** The player card of the Konami code easter egg (game/player-card.ts). */
  game: Game;
  stack: readonly StackGroup[];
}

/** The privacy page: what the site really stores and who handles it. */
export interface PrivacyContent {
  updated: string;
  intro: string;
  sections: readonly { heading: string; paragraphs: readonly string[] }[];
}
