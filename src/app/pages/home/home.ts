import { ChangeDetectionStrategy, Component, LOCALE_ID, inject } from '@angular/core';
import { CONTENT } from '../../content/content';
import { around, voices } from '../../content/voices';
import { toLocale } from '../../core/i18n/locale';
import { homeJsonLd } from '../../core/seo/seo';
import { SeoService } from '../../core/seo/seo.service';
import { PixelField } from '../../pixel-field/pixel-field';
import { PixelDissolve } from '../../pixel-dissolve/pixel-dissolve';
import { Thread } from '../../layout/thread/thread';
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
import { workHoverEffect } from '../../motion/effects/work-hover';
import { type Effect, MotionHost } from '../../motion/motion-host';
import { MoaiFigure } from '../../voxel/moai-figure/moai-figure';
import { MoaiPeek } from '../../voxel/moai-peek';
import { GithubMark } from '../../layout/github-mark';
import { PixelArrow } from '../../layout/pixel-arrow';
import { LinkedinMark } from '../../layout/linkedin-mark';
import { Depixelate } from '../../depixelate/depixelate.directive';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MotionHost, PixelField, PixelDissolve, Thread, WorkList, SideQuests, AtAGlance, ExperienceTimeline, ExperienceStudies, StackList, MoaiFigure, MoaiPeek, GithubMark, LinkedinMark, PixelArrow, Depixelate, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  protected readonly content = inject(CONTENT);
  protected readonly head = voices(this.content.hero.headline, this.content.hero.voice);
  protected readonly statement = voices(this.content.aboutStatement, this.content.aboutVoice);
  protected readonly lede = around(this.content.hero.lede, this.content.hero.peek);
  protected readonly effects: readonly Effect[] = [heroEffect, moaiEffect, workHoverEffect, experienceEffect, stackLevelsEffect, finaleEffect, dissolveEffect, threadEffect, aboutWordsEffect, figuresEffect, parallaxEffect];
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
