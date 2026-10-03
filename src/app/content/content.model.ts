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

export interface Project {
  slug: string;
  title: string;
  summary: string;
  stack: readonly string[];
  repoUrls: readonly string[];
  demoUrl?: string;
}

export interface SiteContent {
  person: Person;
  hero: { headline: string; lede: string };
  about: string;
  projects: readonly Project[];
}
