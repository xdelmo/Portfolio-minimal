import { CONTENT_EN } from '../src/app/content/content.en';

/** The projects as the site lists them (issue #115): a new one is checked by every page, axe and link test at once. */
export const PROJECTS = CONTENT_EN.projects;
export const SLUGS = PROJECTS.map((p) => p.slug);
/** Every case study in both languages. */
export const CASE_STUDIES = SLUGS.flatMap((s) => [`/en/work/${s}`, `/it/work/${s}`]);
