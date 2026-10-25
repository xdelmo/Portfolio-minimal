import type { SiteContent } from './content.model';

/**
 * The content with links only to the repositories a visitor can open (issue #81): the others answer 404.
 * `isPublic` comes from the list scripts/public-repos.mjs writes at every build.
 */
export function onlyPublic(content: SiteContent, isPublic: (url: string) => boolean): SiteContent {
  return {
    ...content,
    projects: content.projects.map((p) => ({ ...p, repos: p.repos.filter((r) => isPublic(r.url)) })),
    sideQuests: content.sideQuests.map(({ repo, ...q }) => (repo && isPublic(repo) ? { ...q, repo } : q)),
  };
}
