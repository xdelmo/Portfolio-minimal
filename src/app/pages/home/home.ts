import { ChangeDetectionStrategy, Component, LOCALE_ID, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CONTENT } from '../../content/content';
import { toLocale } from '../../core/i18n/locale';
import { personJsonLd } from '../../core/seo/seo';
import { SeoService } from '../../core/seo/seo.service';
import { WorkList } from '../../sections/work-list/work-list';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, WorkList],
  template: `
    <section class="hero container" aria-labelledby="hero-title">
      <h1 id="hero-title">{{ content.hero.headline }}</h1>
      <p class="lede">{{ content.hero.lede }}</p>
      <p class="availability">{{ content.person.availability }}</p>
      <div class="actions">
        <a class="button button--primary" routerLink="/" fragment="work" i18n="@@home.cta.work">See my work</a>
        <a class="button" routerLink="/" fragment="contact" i18n="@@home.cta.contact">Contact me</a>
      </div>
    </section>

    <section id="work" class="section container" aria-labelledby="work-title">
      <h2 id="work-title" i18n="@@home.work.title">Selected work</h2>
      <app-work-list [projects]="content.projects" />
    </section>

    <section id="about" class="section container" aria-labelledby="about-title">
      <h2 id="about-title" i18n="@@home.about.title">About</h2>
      <p>{{ content.about }}</p>
    </section>

    <section id="contact" class="section container" aria-labelledby="contact-title">
      <h2 id="contact-title" i18n="@@home.contact.title">Get in touch</h2>
      <p>
        <a [href]="'mailto:' + content.person.email">{{ content.person.email }}</a>
      </p>
      <p class="muted" i18n="@@home.contact.cv">CV available on request.</p>
    </section>
  `,
  styles: `
    .hero {
      display: grid;
      gap: var(--space-3);
      padding-block: var(--space-12) var(--space-16);
    }
    .hero h1 {
      max-width: 16ch;
    }
    .lede {
      font-size: var(--step-1);
    }
    .availability,
    .muted {
      color: var(--fg-muted);
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
      margin-top: var(--space-2);
    }
    .section {
      display: grid;
      gap: var(--space-4);
      padding-block: var(--space-12);
      scroll-margin-top: var(--space-2);
    }
  `,
})
export class Home {
  protected readonly content = inject(CONTENT);
  private readonly seo = inject(SeoService);
  private readonly locale = toLocale(inject(LOCALE_ID));

  constructor() {
    const { person } = this.content;
    this.seo.update({
      path: '/',
      title: `${person.name} — ${person.role}`,
      description: `${this.content.hero.lede} ${person.availability}`,
    });
    this.seo.setJsonLd('ld-person', personJsonLd(person, this.locale));
  }
}
