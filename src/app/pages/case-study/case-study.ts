import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CONTENT } from '../../content/content';
import { SeoService } from '../../core/seo/seo.service';

@Component({
  selector: 'app-case-study',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <article class="container case-study">
      @if (project(); as p) {
        <h1>{{ p.title }}</h1>
        <p class="summary">{{ p.summary }}</p>
        <ul class="stack" i18n-aria-label="@@case.stack" aria-label="Technologies">
          @for (tech of p.stack; track tech) {
            <li>{{ tech }}</li>
          }
        </ul>
        <p class="links">
          @if (p.demoUrl) {
            <a class="button button--primary" [href]="p.demoUrl" i18n="@@case.demo">Open the live demo</a>
          }
          @for (repo of p.repos; track repo.url) {
            <a class="button" [href]="repo.url">{{ repo.label }}</a>
          }
        </p>
      } @else {
        <h1 i18n="@@case.notFound">Project not found</h1>
        <p><a routerLink="/" i18n="@@notFound.home">Go to the home page</a></p>
      }
    </article>
  `,
  styles: `
    .case-study {
      display: grid;
      gap: var(--space-4);
      padding-block: var(--space-12);
    }
    .summary {
      font-size: var(--step-1);
    }
    .stack {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-1) var(--space-3);
      margin: 0;
      padding: 0;
      list-style: none;
      color: var(--fg-muted);
    }
    .links {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
    }
  `,
})
export class CaseStudy {
  private readonly content = inject(CONTENT);
  readonly slug = input.required<string>();
  protected readonly project = computed(() => this.content.projects.find((p) => p.slug === this.slug()));
  private readonly seo = inject(SeoService);

  constructor() {
    effect(() => {
      const p = this.project();
      this.seo.setJsonLd('ld-person', null);
      this.seo.update(
        p
          ? { path: `/work/${p.slug}`, title: `${p.title} — Emanuele Del Monte`, description: p.summary }
          : { path: `/work/${this.slug()}`, title: 'Emanuele Del Monte', description: '', noindex: true },
      );
    });
  }
}
