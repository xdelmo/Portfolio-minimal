import { ChangeDetectionStrategy, Component, LOCALE_ID, computed, effect, inject, input } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CONTENT } from '../../content/content';
import { toLocale } from '../../core/i18n/locale';
import { caseStudyJsonLd } from '../../core/seo/seo';
import { SeoService } from '../../core/seo/seo.service';

@Component({
  selector: 'app-case-study',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NgOptimizedImage],
  template: `
    <article class="container case-study">
      @if (project(); as p) {
        <header class="intro">
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
        </header>

        @if (p.image; as image) {
          <img class="shot" [class.shot--tall]="image.height > image.width" [ngSrc]="image.src" [ngSrcset]="image.width / 2 + 'w, ' + image.width + 'w'" [loaderParams]="{ full: image.width }" sizes="(min-width: 1024px) 960px, 100vw" [width]="image.width" [height]="image.height" [alt]="image.alt" priority />
        }

        <section id="context" aria-labelledby="context-title">
          <h2 id="context-title" i18n="@@case.context">Context</h2>
          <p>{{ p.caseStudy.context }}</p>
        </section>

        <section id="architecture" aria-labelledby="architecture-title">
          <h2 id="architecture-title" i18n="@@case.architecture">How it is built</h2>
          <ul class="bullets">
            @for (item of p.caseStudy.architecture; track item) {
              <li>{{ item }}</li>
            }
          </ul>
        </section>

        <section id="decisions" aria-labelledby="decisions-title">
          <h2 id="decisions-title" i18n="@@case.decisions">Key decisions</h2>
          @for (decision of p.caseStudy.decisions; track decision.title) {
            <h3>{{ decision.title }}</h3>
            <p>{{ decision.body }}</p>
          }
        </section>

        <section id="outcome" aria-labelledby="outcome-title">
          <h2 id="outcome-title" i18n="@@case.outcome">Outcome</h2>
          <p>{{ p.caseStudy.outcome }}</p>
        </section>

        <p class="back"><a routerLink="/" fragment="work" i18n="@@case.back">See all projects</a></p>
      } @else {
        <h1 i18n="@@case.notFound">Project not found</h1>
        <p><a routerLink="/" i18n="@@notFound.home">Go to the home page</a></p>
      }
    </article>
  `,
  styles: `
    .case-study {
      display: grid;
      gap: var(--space-8);
      padding-block: var(--space-12);
    }
    .intro,
    section {
      display: grid;
      gap: var(--space-3);
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
    h2 {
      font-size: var(--step-3);
    }
    h3 {
      margin-top: var(--space-2);
      font-size: var(--step-1);
    }
    .bullets {
      display: grid;
      gap: var(--space-2);
      max-width: var(--measure);
      margin: 0;
      padding-left: var(--space-3);
    }
    .shot {
      width: 100%;
      height: auto;
      border: 1px solid var(--rule);
      background: var(--surface);
    }
    .shot--tall {
      max-width: 360px;
    }
  `,
})
export class CaseStudy {
  private readonly content = inject(CONTENT);
  readonly slug = input.required<string>();
  protected readonly project = computed(() => this.content.projects.find((p) => p.slug === this.slug()));
  private readonly seo = inject(SeoService);
  private readonly locale = toLocale(inject(LOCALE_ID));

  constructor() {
    effect(() => {
      const p = this.project();
      this.seo.setJsonLd('ld-page', p ? caseStudyJsonLd(p, this.content.person, this.locale) : null);
      this.seo.update(
        p
          ? { path: `/work/${p.slug}`, title: `${p.title} — Emanuele Del Monte`, description: p.summary, ogImage: p.slug }
          : { path: `/work/${this.slug()}`, title: 'Emanuele Del Monte', description: '', noindex: true },
      );
    });
  }
}
