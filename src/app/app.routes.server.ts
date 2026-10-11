import { RenderMode, ServerRoute } from '@angular/ssr';
import { BLOG } from './content/blog.generated';
import { CONTENT_EN } from './content/content.en';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'work/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams() {
      return Promise.resolve(CONTENT_EN.projects.map((p) => ({ slug: p.slug })));
    },
  },
  {
    path: 'blog/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams() {
      return Promise.resolve(BLOG.en.map((a) => ({ slug: a.slug })));
    },
  },
  { path: '**', renderMode: RenderMode.Prerender },
];
