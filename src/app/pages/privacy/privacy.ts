import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CONTENT } from '../../content/content';
import { SeoService } from '../../core/seo/seo.service';

/** What the site stores and who handles it (issue #3). Out of the index: it is for visitors, not for search. */
@Component({
  selector: 'app-privacy',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <article class="container privacy">
      <h1>Privacy</h1>
      <p class="updated">{{ privacy.updated }}</p>
      <p class="intro">{{ privacy.intro }}</p>
      @for (section of privacy.sections; track section.heading) {
        <section>
          <h2>{{ section.heading }}</h2>
          @for (paragraph of section.paragraphs; track paragraph) {
            <p>{{ paragraph }}</p>
          }
        </section>
      }
      <!-- a way on, as at the end of the other pages to read (issue #229) -->
      <p class="more"><a class="touch-line" routerLink="/" i18n="@@notFound.home">Go to the home page</a></p>
    </article>
  `,
  styles: `
    .privacy {
      display: grid;
      gap: var(--space-4);
      padding-block: var(--space-12) var(--space-16);
    }
    section {
      display: grid;
      gap: var(--space-2);
    }
    h2 {
      font-size: var(--step-2);
    }
    p {
      max-width: var(--measure);
      margin: 0;
    }
.more {
      padding-top: var(--space-4);
      border-top: 1px solid var(--rule);
    }
    .updated {
      color: var(--fg-muted);
      font-size: var(--step--1);
    }
    .intro {
      font-size: var(--step-1);
      // the larger size would stretch the body's measure: 58ch ÷ 1.25 (issues #93, #229)
      max-width: 46ch;
    }
  `,
})
export class Privacy {
  protected readonly privacy = inject(CONTENT).privacy;

  constructor() {
    const seo = inject(SeoService);
    seo.update({ path: '/privacy', title: 'Privacy — Emanuele Del Monte', description: this.privacy.intro, noindex: true });
    seo.setJsonLd('ld-page', null);
  }
}
