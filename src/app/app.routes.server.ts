import { RenderMode, ServerRoute } from '@angular/ssr';
import { CONTENT_EN } from './content/content.en';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'work/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams() {
      return Promise.resolve(CONTENT_EN.projects.map((p) => ({ slug: p.slug })));
    },
  },
  { path: '**', renderMode: RenderMode.Prerender },
];
