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
