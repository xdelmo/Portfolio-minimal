import { EnvironmentInjector, inject } from '@angular/core';
import { CanMatchFn, Routes } from '@angular/router';
import { CONTENT } from './content/content';

const hasProject: CanMatchFn = (_route, segments) =>
  segments.length === 2 && inject(CONTENT).projects.some((p) => p.slug === segments[1].path);

const hasArticle: CanMatchFn = (_route, segments) => {
  if (segments.length !== 2) return false;
  const injector = inject(EnvironmentInjector);
  return import('./content/blog').then(({ BLOG }) => injector.get(BLOG).some((a) => a.slug === segments[1].path));
};

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home').then((m) => m.Home) },
  { path: 'work/:slug', canMatch: [hasProject], loadComponent: () => import('./pages/case-study/case-study').then((m) => m.CaseStudy) },
  { path: 'blog', loadComponent: () => import('./pages/blog/blog-index/blog-index').then((m) => m.BlogIndex) },
  { path: 'blog/:slug', canMatch: [hasArticle], loadComponent: () => import('./pages/blog/article/article').then((m) => m.ArticlePage) },
  { path: 'privacy', loadComponent: () => import('./pages/privacy/privacy').then((m) => m.Privacy) },
  { path: '404', loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFound) },
  // render in place so the mistyped URL stays in the address bar
  { path: '**', loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFound) },
];
