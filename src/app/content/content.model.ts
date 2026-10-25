import type { SpriteName } from '../sections/side-quests/sprites';

export interface Person {
  name: string;
  role: string;
  employer: string;
  location: string;
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
  /** Whose project it is and in what context, said up front as a plain sentence: a thesis, a side project, with whom. */
  role: string;
  summary: string;
  stack: readonly string[];
  /** Every repository, private ones too: the build links only the public ones (content/public-repos.ts). */
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
  /** The code on GitHub; the build drops it while the repository is private (content/public-repos.ts). */
  repo?: string;
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
  /** One string per paragraph. */
  about: readonly string[];
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

/** A blog post (issue #1), built from src/app/content/blog/<slug>/<locale>.md by scripts/blog.mjs. */
export interface Article {
  slug: string;
  title: string;
  description: string;
  /** YYYY-MM-DD, first published on this site */
  date: string;
  /** the date in words, in the article's language */
  dateLabel: string;
  updated?: string;
  /** the slug of the case study it is about */
  project?: string;
  /** the LinkedIn post it grew from */
  linkedin?: string;
  minutes: number;
  /** runs of HTML written at build time, and code blocks drawn with their copy button (issue #191) */
  parts: readonly ArticlePart[];
  markdown: string;
}

/** A run of HTML (`html`), or a code block (`code`, with its language when the Markdown names one). */
export interface ArticlePart {
  html?: string;
  code?: string;
  lang?: string;
}
