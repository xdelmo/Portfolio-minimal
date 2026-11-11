import { ChangeDetectionStrategy, Component, LOCALE_ID, inject } from '@angular/core';
import { CONTENT } from '../../content/content';
import { around, voices } from '../../content/voices';
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
import { parallaxEffect } from '../../motion/effects/parallax';
import { experienceEffect } from '../../motion/effects/experience';
import { figuresEffect } from '../../motion/effects/figures';
import { finaleEffect } from '../../motion/effects/finale';
import { heroEffect } from '../../motion/effects/hero';
import { moaiEffect } from '../../motion/effects/moai';
import { stackLevelsEffect } from '../../motion/effects/stack-levels';
import { threadEffect } from '../../motion/effects/thread';
import { titlesEffect } from '../../motion/effects/titles';
import { workHoverEffect } from '../../motion/effects/work-hover';
import { type Effect, MotionHost } from '../../motion/motion-host';
import { MoaiFigure } from '../../voxel/moai-figure';
import { MoaiPeek } from '../../voxel/moai-peek';
import { GithubMark } from '../../layout/github-mark';
import { PixelArrow } from '../../layout/pixel-arrow';
import { LinkedinMark } from '../../layout/linkedin-mark';
import { Depixelate } from '../../depixelate/depixelate.directive';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MotionHost, PixelField, PixelDissolve, Thread, WorkList, SideQuests, AtAGlance, ExperienceTimeline, ExperienceStudies, StackList, MoaiFigure, MoaiPeek, GithubMark, LinkedinMark, PixelArrow, Depixelate],
  template: `
    <div class="motion" [appMotion]="effects">
    <section class="hero" aria-labelledby="hero-title">
      <div class="copy" #copy>
      <h1 id="hero-title"><span class="method">{{ head[0] }}</span>&ngsp;<span class="voice">{{ head[1] }}</span></h1>
      <p class="lede">{{ lede[0] }}<app-moai-peek [word]="lede[1]" />{{ lede[2] }}</p>
      </div>
      <app-pixel-field class="field" [clear]="copy" />
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
        <p class="statement"><span class="method">{{ statement[0] }}</span>&ngsp;<span class="voice">{{ statement[1] }}</span></p>
        <div class="about-body">
          @for (paragraph of content.about; track $index) {
            <p>{{ paragraph }}</p>
          }
        </div>
        <!-- the proof under the statement (issue #392): big numbers, each read as one sentence with its label -->
        <ul class="figures" role="list">
          @for (figure of content.figures; track figure.value) {
            <li><span class="figure"><span class="figure-value">{{ figure.value }}</span><span class="plus">+</span></span>&ngsp;<span class="figure-label">{{ figure.label }}</span></li>
          }
        </ul>
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
      <p class="muted" i18n="@@home.sideQuests.lede">Things I build for fun, from Telegram bots to 3D-printed parts.</p>
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
        <p class="contact-lede" i18n="@@home.contact.lede">Hiring for a frontend role?</p>
        <h2 id="contact-title">
          <a class="contact-link" [href]="content.person.linkedin" target="_blank" rel="me noopener" aria-describedby="new-tab"><span class="contact-label voice" i18n="@@home.contact.title">Let’s talk</span><app-pixel-arrow class="contact-arrow" /></a>
        </h2>
        <ul class="profiles">
          <li><a class="repo-link" [href]="content.person.linkedin" target="_blank" aria-describedby="new-tab" rel="me noopener"><app-linkedin-mark />LinkedIn</a></li>
          <li><a class="repo-link" [href]="content.person.github" target="_blank" aria-describedby="new-tab" rel="me noopener"><app-github-mark />GitHub</a></li>
        </ul>
      </div>
      <img appDepixelate class="contact-photo" src="images/emanuele.webp" [alt]="content.person.name" width="512" height="512" loading="lazy" decoding="async" />
    </section>
    </div>
  `,
  styleUrl: './home.scss',
})
export class Home {
  protected readonly content = inject(CONTENT);
  protected readonly head = voices(this.content.hero.headline, this.content.hero.voice);
  protected readonly statement = voices(this.content.aboutStatement, this.content.aboutVoice);
  protected readonly lede = around(this.content.hero.lede, this.content.hero.peek);
  protected readonly effects: readonly Effect[] = [heroEffect, moaiEffect, titlesEffect, workHoverEffect, experienceEffect, stackLevelsEffect, finaleEffect, dissolveEffect, threadEffect, aboutWordsEffect, figuresEffect, parallaxEffect];
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
