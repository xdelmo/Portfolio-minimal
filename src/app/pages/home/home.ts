import { ChangeDetectionStrategy, Component, LOCALE_ID, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CONTENT } from '../../content/content';
import { toLocale } from '../../core/i18n/locale';
import { homeJsonLd } from '../../core/seo/seo';
import { SeoService } from '../../core/seo/seo.service';
import { PixelField } from '../../pixel-field/pixel-field';
import { PixelDissolve } from '../../pixel-dissolve/pixel-dissolve';
import { Thread } from '../../layout/thread';
import { AtAGlance } from '../../sections/at-a-glance/at-a-glance';
import { ExperienceStudies } from '../../sections/experience-timeline/experience-studies';
import { ExperienceTimeline } from '../../sections/experience-timeline/experience-timeline';
import { SideQuests } from '../../sections/side-quests/side-quests';
import { StackList } from '../../sections/stack-list/stack-list';
import { WorkList } from '../../sections/work-list/work-list';
import { dissolveEffect } from '../../motion/effects/dissolve';
import { aboutWordsEffect } from '../../motion/effects/about-words';
import { experienceEffect } from '../../motion/effects/experience';
import { finaleEffect } from '../../motion/effects/finale';
import { heroEffect } from '../../motion/effects/hero';
import { stackLevelsEffect } from '../../motion/effects/stack-levels';
import { threadEffect } from '../../motion/effects/thread';
import { titlesEffect } from '../../motion/effects/titles';
import { workHoverEffect } from '../../motion/effects/work-hover';
import { type Effect, MotionHost } from '../../motion/motion-host';
import { MoaiFigure } from '../../voxel/moai-figure';
import { GithubMark } from '../../layout/github-mark';
import { PixelArrow } from '../../layout/pixel-arrow';
import { LinkedinMark } from '../../layout/linkedin-mark';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MotionHost, PixelField, PixelDissolve, Thread, WorkList, SideQuests, AtAGlance, ExperienceTimeline, ExperienceStudies, StackList, MoaiFigure, GithubMark, LinkedinMark, PixelArrow],
  template: `
    <div class="motion" [appMotion]="effects">
    <section class="hero container" aria-labelledby="hero-title">
      <h1 id="hero-title">{{ content.hero.headline }}</h1>
      <p class="lede">{{ content.hero.lede }}</p>
      <p class="availability">{{ content.person.availability }}</p>
      <div class="actions">
        <a class="button button--primary" data-magnetic routerLink="/" fragment="work" i18n="@@home.cta.work">See my work</a>
        <a class="button" data-magnetic routerLink="/" fragment="contact" i18n="@@home.cta.contact">Contact me</a>
      </div>
      <app-pixel-field class="field" />
      <app-pixel-dissolve class="seam seam--hero" data-scrub [cols]="120" [rows]="3" [colors]="heroSeam" grow="up" />
    </section>

    <div class="trail">
    <app-thread />
    <section id="work" class="section container" aria-labelledby="work-title">
      <h2 id="work-title" i18n="@@home.work.title">Selected work</h2>
      <app-work-list [projects]="content.projects" />
    </section>

    <section id="about" class="section container about band band--pastel" aria-labelledby="about-title">
      <app-pixel-dissolve class="seam" data-scrub [cols]="120" [rows]="3" [colors]="aboutSeam" grow="up" />
      <div class="about-text">
        <h2 id="about-title" i18n="@@home.about.title">About</h2>
        <p class="statement">{{ content.aboutStatement }}</p>
        <p>{{ content.about }}</p>
        <app-at-a-glance [items]="content.glance" />
      </div>
      <app-moai-figure class="about-moai" />
    </section>

    <section id="experience" class="section container" aria-labelledby="experience-title">
      <!-- only the deck is pinned (motion/effects/experience.ts); the studies below stay in the page flow -->
      <div class="deck">
        <h2 id="experience-title" i18n="@@home.experience.title">Experience</h2>
        <app-experience-timeline [items]="content.experience" />
      </div>
      <app-experience-studies [studies]="content.studies" />
    </section>

    <section id="side-quests" class="section container band band--lavender" aria-labelledby="side-quests-title">
      <app-pixel-dissolve class="seam" data-scrub [cols]="120" [rows]="3" [colors]="sideQuestsSeam" grow="up" />
      <h2 id="side-quests-title" i18n="@@home.sideQuests.title">Side quests</h2>
      <p class="muted" i18n="@@home.sideQuests.lede">Things I build for fun, from crosswords to 3D-printed parts.</p>
      <app-side-quests [items]="content.sideQuests" />
    </section>

    <section id="stack" class="section container" aria-labelledby="stack-title">
      <h2 id="stack-title" i18n="@@home.stack.title">Tools I use</h2>
      <p class="muted" i18n="@@home.stack.lede">Three levels: what I use every day, what runs in production, what I try in my side projects.</p>
      <app-stack-list [groups]="content.stack" />
    </section>

    </div>

    <section id="contact" class="section container band band--ink contact" aria-labelledby="contact-title">
      <app-pixel-dissolve class="seam" data-scrub [cols]="120" [rows]="3" [colors]="contactSeam" grow="up" />
      <div class="contact-text">
        <p class="contact-lede"><span i18n="@@home.contact.lede">Building something with Angular, or hiring for a frontend role? Write to me.</span> {{ content.person.availability }}</p>
        <h2 id="contact-title">
          <a class="contact-link" [href]="'mailto:' + content.person.email"><span class="contact-label" i18n="@@home.contact.title">Get in touch</span><app-pixel-arrow class="contact-arrow" /></a>
        </h2>
        <ul class="profiles">
          <li><a class="repo-link" [href]="content.person.linkedin" target="_blank" aria-describedby="new-tab" rel="me noopener"><app-linkedin-mark />LinkedIn</a></li>
          <li><a class="repo-link" [href]="content.person.github" target="_blank" aria-describedby="new-tab" rel="me noopener"><app-github-mark />GitHub</a></li>
        </ul>
      </div>
      <img class="contact-photo" src="images/emanuele.jpg" [alt]="content.person.name" width="512" height="512" loading="lazy" decoding="async" />
    </section>
    </div>
  `,
  styles: `
    @use 'styles/breakpoints' as bp;

    .motion {
      display: contents;
    }

    .hero {
      position: relative;
      display: grid;
      gap: var(--space-3);
      padding-block: var(--space-12) var(--space-16);
    }
    .hero h1 {
      max-width: 16ch;
    }
    // body size on phones, where the 44px headline would otherwise have a subtitle half its size beside it
    .lede {
      @include bp.up(md) {
        font-size: var(--step-1);
      }
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
    // the field fills the whole hero, edge to edge, behind the text. Phones: lit in the space above the title, faint
    // under the text, which runs the full width there
    .hero {
      isolation: isolate;
    }
    .field {
      position: absolute;
      inset: 0 calc(50% - 50vw);
      z-index: -1;
      height: auto;
      mask-image: linear-gradient(to bottom, #000 0, rgb(0 0 0 / 0.6) var(--space-16));
    }
    .contact {
      display: grid;
      gap: var(--space-4);
    }
    .contact-text {
      display: grid;
      gap: var(--space-3);
    }
    .contact-text > * {
      margin: 0;
    }
    .contact-lede {
      max-width: 40ch;
      font-size: var(--step-1);
    }
    // the giant title is the action, as in the references: the whole line writes an email
    .contact-link {
      display: inline-flex;
      flex-wrap: wrap;
      align-items: flex-end;
      gap: 0 0.12em;
      color: inherit;
      text-decoration: none;
    }
    .contact-label {
      display: block;
    }
    .contact-arrow {
      width: 0.5em;
      height: 0.5em;
      margin-bottom: 0.16em;
      color: var(--link);
    }
    .contact-link:hover .contact-label {
      text-decoration: underline;
      text-decoration-thickness: 0.05em;
      text-underline-offset: 0.08em;
    }
    @media (hover: hover) and (prefers-reduced-motion: no-preference) {
      .contact-arrow {
        transition: transform 160ms steps(2);
      }
      .contact-link:hover .contact-arrow {
        transform: translate(0.08em, -0.08em);
      }
    }
    .profiles {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
      padding: 0;
      list-style: none;
    }
    // a circle drawn on the pixel grid, 16 cells across: round like the tool rings, stepped like the pixel field
    .contact-photo {
      grid-row: 1;
      width: 160px;
      height: auto;
      mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' shape-rendering='crispEdges'%3E%3Cpath d='M5 0h6v1h-6zM3 1h10v1h-10zM2 2h12v1h-12zM1 3h14v1h-14zM1 4h14v1h-14zM0 5h16v1h-16zM0 6h16v1h-16zM0 7h16v1h-16zM0 8h16v1h-16zM0 9h16v1h-16zM0 10h16v1h-16zM1 11h14v1h-14zM1 12h14v1h-14zM2 13h12v1h-12zM3 14h10v1h-10zM5 15h6v1h-6z'/%3E%3C/svg%3E") center / 100% 100% no-repeat;
    }
    @include bp.up(md) {
      .contact {
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: end;
      }
      .contact-photo {
        grid-row: auto;
        width: 256px;
      }
    }
    #contact h2 {
      font-size: clamp(3rem, 1rem + 8vw, 9rem);
      line-height: 0.95;
    }
    // below the text on phones and tablets: centred, not stranded on the left of an empty band
    .about-moai {
      justify-self: center;
    }
    .about-text {
      display: grid;
      gap: var(--space-4);
    }
    // the About's one idea: a sentence in the hero's condensed type, its words lit by the scroll (about-words.ts)
    .statement {
      max-width: 18ch;
      font-size: clamp(2.2rem, 1.2rem + 4vw, var(--step-5));
      font-weight: 600;
      line-height: 1.05;
      font-variation-settings: 'wdth' 75;
      letter-spacing: -0.01em;
      text-wrap: balance;
    }

    @include bp.up(lg) {
      .about {
        grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
        column-gap: var(--space-8);
        align-items: start;
      }
      .about-moai {
        position: sticky;
        // below the sticky header, never under it
        top: calc(var(--header-h) + var(--space-8));
      }
      .hero {
        grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
        column-gap: var(--space-8);
        align-content: start;
        // the first screen below the sticky header, so the seam at its foot meets the bottom edge of the viewport
        min-height: calc(100svh - var(--header-h));
        padding-block: var(--space-8);
      }
      // not the seam: an absolute child placed in a column takes that column's area as its box, and its full-bleed
      // inset (50% - 50vw) then starts 16px in from the left edge (issue #85)
      .hero > :not(.field, .seam) {
        grid-column: 1;
      }
      // desktop: faint under the text column so the words keep their contrast, alive towards the right
      .field {
        mask-image: linear-gradient(to right, rgb(0 0 0 / 0.35) 0 40%, #000 70%);
      }
    }
    // pixel seams: full-bleed strips of 16px cells; a band grows one above its top edge, the hero one at its foot
    .seam {
      position: absolute;
      inset-inline: calc(50% - 50vw);
      height: var(--space-6);
      // follows the contact band while it widens from a card (finale.ts)
      clip-path: inset(0 var(--band-inset, 0%));
    }
    .band > .seam {
      bottom: 100%;
    }
    .seam--hero {
      bottom: 0;
    }
    .trail {
      position: relative;
    }
    // the tool rings turn in under the side quests band above, and under the title
    #side-quests {
      z-index: 1;
    }
    #stack h2 {
      position: relative;
      z-index: 1;
    }
    .section,
    .deck {
      display: grid;
      gap: var(--space-4);
      scroll-margin-top: var(--space-2);
    }
    .section {
      padding-block: var(--space-8);
    }
    // a band grows its pixel seam above its top edge, into the section before it: that section keeps 64px of air
    // below its last line on top of the seam, like every other section
    .section:has(+ .band > .seam),
    // the stack closes the pixel thread's trail, and the contact band comes right after it
    .trail:has(+ .band > .seam) > .section:last-child {
      padding-bottom: calc(var(--space-8) + var(--space-6));
    }
  `,
})
export class Home {
  protected readonly content = inject(CONTENT);
  protected readonly effects: readonly Effect[] = [heroEffect, titlesEffect, workHoverEffect, experienceEffect, stackLevelsEffect, finaleEffect, dissolveEffect, threadEffect, aboutWordsEffect];
  // the band colour first (most cells), then the pixel tints that crumble off it
  protected readonly heroSeam = ['--px-3', '--px-2', '--px-4', '--px-5', '--px-6'];
  protected readonly aboutSeam = ['--band-pastel-bg', '--px-2', '--px-4', '--px-5'];
  protected readonly sideQuestsSeam = ['--band-lavender-bg', '--px-4', '--px-5', '--px-6'];
  protected readonly contactSeam = ['--band-ink-bg', '--px-1', '--px-2', '--px-4'];
  private readonly seo = inject(SeoService);
  private readonly locale = toLocale(inject(LOCALE_ID));

  constructor() {
    const { person } = this.content;
    this.seo.update({ path: '/', title: this.content.seo.title, description: this.content.seo.description, ogImage: 'home' });
    this.seo.setJsonLd('ld-page', homeJsonLd(person, this.locale));
  }
}
