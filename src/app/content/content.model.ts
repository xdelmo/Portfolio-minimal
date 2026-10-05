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

export interface Achievement {
  title: string;
  detail: string;
  sprite: SpriteName;
}

export interface Game {
  /** About the years of experience. */
  level: number;
  /** The role the experience points lead to. */
  next: string;
  /** Progress towards `next`, from 0 to 1. */
  xp: number;
  achievements: readonly Achievement[];
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
  hero: { headline: string; lede: string };
  /** One sentence that opens the About section, in large type. */
  aboutStatement: string;
  about: string;
  glance: readonly GlanceItem[];
  projects: readonly Project[];
  experience: readonly ExperienceItem[];
  sideQuests: readonly SideQuest[];
  /** The player card of the Konami code easter egg (game/player-card.ts). */
  game: Game;
  stack: readonly StackGroup[];
}
