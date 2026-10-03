import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/seo/seo.service';

@Component({
  selector: 'app-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="container not-found">
      <h1 i18n="@@notFound.title">This page doesn't exist</h1>
      <p i18n="@@notFound.text">The link may be old or mistyped.</p>
      <p><a class="button button--primary" routerLink="/" i18n="@@notFound.home">Go to the home page</a></p>
    </section>
  `,
  styles: `
    .not-found {
      display: grid;
      gap: var(--space-3);
      padding-block: var(--space-16);
    }
  `,
})
export class NotFound {
  constructor() {
    inject(SeoService).update({ path: '/404', title: 'Emanuele Del Monte', description: '', noindex: true });
  }
}
