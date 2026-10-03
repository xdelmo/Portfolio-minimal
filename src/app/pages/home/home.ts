import { ChangeDetectionStrategy, Component, LOCALE_ID, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CONTENT } from '../../content/content';
import { toLocale } from '../../core/i18n/locale';
import { personJsonLd } from '../../core/seo/seo';
import { SeoService } from '../../core/seo/seo.service';
import { PixelField } from '../../pixel-field/pixel-field';
import { AtAGlance } from '../../sections/at-a-glance/at-a-glance';
import { ExperienceTimeline } from '../../sections/experience-timeline/experience-timeline';
import { SideQuests } from '../../sections/side-quests/side-quests';
import { StackList } from '../../sections/stack-list/stack-list';
import { WorkList } from '../../sections/work-list/work-list';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PixelField, WorkList, SideQuests, AtAGlance, ExperienceTimeline, StackList],
  template: `
    <section class="hero container" aria-labelledby="hero-title">
      <h1 id="hero-title">{{ content.hero.headline }}</h1>
      <p class="lede">{{ content.hero.lede }}</p>
      <p class="availability">{{ content.person.availability }}</p>
      <div class="actions">
        <a class="button button--primary" routerLink="/" fragment="work" i18n="@@home.cta.work">See my work</a>
        <a class="button" routerLink="/" fragment="contact" i18n="@@home.cta.contact">Contact me</a>
      </div>
      <app-pixel-field class="field" />
    </section>

    <section id="work" class="section container" aria-labelledby="work-title">
      <h2 id="work-title" i18n="@@home.work.title">Selected work</h2>
      <app-work-list [projects]="content.projects" />
    </section>

    <section id="side-quests" class="section container" aria-labelledby="side-quests-title">
      <h2 id="side-quests-title" i18n="@@home.sideQuests.title">Side quests</h2>
      <p class="muted" i18n="@@home.sideQuests.lede">Things I build for fun, from crosswords to 3D-printed parts.</p>
      <app-side-quests [items]="content.sideQuests" />
    </section>

    <section id="about" class="section container" aria-labelledby="about-title">
      <h2 id="about-title" i18n="@@home.about.title">About</h2>
      <p>{{ content.about }}</p>
      <app-at-a-glance [items]="content.glance" />
    </section>

    <section id="experience" class="section container" aria-labelledby="experience-title">
      <h2 id="experience-title" i18n="@@home.experience.title">Experience</h2>
      <app-experience-timeline [items]="content.experience" />
    </section>

    <section id="stack" class="section container" aria-labelledby="stack-title">
      <h2 id="stack-title" i18n="@@home.stack.title">Tools I use</h2>
      <app-stack-list [groups]="content.stack" />
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
    @use 'styles/breakpoints' as bp;

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
    .field {
      margin-top: var(--space-6);
    }
    @include bp.up(lg) {
      .hero {
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        column-gap: var(--space-8);
        align-content: start;
      }
      .hero > :not(.field) {
        grid-column: 1;
      }
      .field {
        grid-column: 2;
        grid-row: 1 / span 4;
        height: auto;
        min-height: 20rem;
        margin-top: 0;
      }
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
