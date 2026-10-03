import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home').then((m) => m.Home) },
  { path: 'work/:slug', loadComponent: () => import('./pages/case-study/case-study').then((m) => m.CaseStudy) },
  { path: '404', loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFound) },
  { path: '**', redirectTo: '404' },
];
