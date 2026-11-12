import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, LOCALE_ID, afterNextRender, afterRenderEffect, computed, effect, inject, input, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BLOG } from '../../content/blog';
import { CONTENT } from '../../content/content';
import { toLocale } from '../../core/i18n/locale';
import { caseStudyJsonLd, caseStudyTitle } from '../../core/seo/seo';
import { ContactPrompt } from '../../layout/contact-prompt';
import { GithubMark } from '../../layout/github-mark';
import { QuestSprite } from '../../sections/side-quests/quest-sprite';
import { SeoService } from '../../core/seo/seo.service';
import { recordVisit } from '../../game/explorer';
import { MoaiCues } from '../../voxel/moai-cues';
import { Depixelate } from '../../depixelate/depixelate.directive';
import { type Effect, MotionHost } from '../../motion/motion-host';
import { stickyEffect } from '../../motion/effects/sticky';
import { smoother } from '../../motion/smoother';

/**
 * Which section the index marks: the last one whose top has passed `line` (a third down the window), or the last of all
 * once the page is scrolled to its end, where a short last section never reaches that line. -1 above the first.
 */
export function sectionBeingRead(tops: readonly number[], line: number, atEnd: boolean): number {
  return atEnd ? tops.length - 1 : tops.reduce((found, top, i) => (top <= line ? i : found), -1);
}

/** How long the Explorer notice stays: under the 5 s after which automatic motion needs the pause button. */
const UNLOCK_NOTICE_MS = 4000;

@Component({
  selector: 'app-case-study',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NgOptimizedImage, ContactPrompt, GithubMark, QuestSprite, Depixelate, MotionHost],
  templateUrl: './case-study.html',
  styleUrl: './case-study.scss',
})
export class CaseStudy {
  private readonly content = inject(CONTENT);
  readonly slug = input.required<string>();
  protected readonly project = computed(() => this.content.projects.find((p) => p.slug === this.slug()));
  private readonly articles = inject(BLOG);
  protected readonly posts = computed(() => this.articles.filter((a) => a.project === this.slug()));
  /** The project after this one in the work list, the first after the last; none when the list has only this one. */
  protected readonly next = computed(() => {
    const { projects } = this.content;
    const i = projects.findIndex((p) => p.slug === this.slug());
    const n = projects[(i + 1) % projects.length];
    return i < 0 || n.slug === this.slug() ? undefined : n;
  });
  private readonly seo = inject(SeoService);
  private readonly cues = inject(MoaiCues);
  private readonly locale = toLocale(inject(LOCALE_ID));

  /** The section being read, for the index (#96). */
  private readonly reading = signal<string | null>(null);
  /** The Explorer achievement was just earned: its notice shows for a few seconds. */
  protected readonly unlocked = signal(false);
  /** Smooth scroll pins the index instead of sticky (issue #159). */
  protected readonly effects: readonly Effect[] = [stickyEffect];
  protected current(id: string): 'location' | null {
    return this.reading() === id ? 'location' : null;
  }

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      // a fixed notice under smooth scroll's transformed content would sit at the page's foot: it lives in <body> (#159)
      const notice = host.querySelector('.unlock');
      if (notice) {
        document.body.append(notice);
        destroyRef.onDestroy(() => {
          notice.remove();
        });
      }
      const sections = [...host.querySelectorAll('section[id]')];
      const update = () => {
        const root = document.documentElement;
        // with smooth scroll the content is still gliding after the last scroll event: read where it will rest (#159)
        const glide = (smoother()?.scrollTop() ?? window.scrollY) - window.scrollY;
        const i = sectionBeingRead(
          sections.map((section) => section.getBoundingClientRect().top + glide),
          window.innerHeight / 3,
          window.scrollY + window.innerHeight >= root.scrollHeight - 2,
        );
        this.reading.set(i < 0 ? null : sections[i].id);
      };
      update();
      window.addEventListener('scroll', update, { passive: true });
      destroyRef.onDestroy(() => {
        window.removeEventListener('scroll', update);
      });
    });
    // the case study counts as read in this browser; a client-side "Next project" reuses the page with a new slug
    afterRenderEffect(() => {
      if (!this.project() || !recordVisit(this.slug(), this.content.projects.map((p) => p.slug))) return;
      this.unlocked.set(true);
      // the moai, in the corner, tips its pukao; it may still be loading, so the cue waits for it
      this.cues.cue('explorer', true);
      const timer = setTimeout(() => {
        this.unlocked.set(false);
      }, UNLOCK_NOTICE_MS);
      destroyRef.onDestroy(() => {
        clearTimeout(timer);
      });
    });
    effect(() => {
      const p = this.project();
      this.seo.setJsonLd('ld-page', p ? caseStudyJsonLd(p, this.content.person, this.locale) : null);
      this.seo.update(
        p
          ? { path: `/work/${p.slug}`, title: caseStudyTitle(p, this.content.person), description: p.summary, ogImage: p.slug }
          : { path: `/work/${this.slug()}`, title: $localize`:@@notFound.pageTitle:Page not found — Emanuele Del Monte`, description: '', noindex: true },
      );
    });
  }
}
