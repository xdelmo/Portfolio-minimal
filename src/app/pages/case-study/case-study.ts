import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, LOCALE_ID, afterNextRender, afterRenderEffect, computed, effect, inject, input, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CONTENT } from '../../content/content';
import { toLocale } from '../../core/i18n/locale';
import { caseStudyJsonLd, caseStudyTitle } from '../../core/seo/seo';
import { GithubMark } from '../../layout/github-mark';
import { QuestSprite } from '../../sections/side-quests/quest-sprite';
import { SeoService } from '../../core/seo/seo.service';
import { recordVisit } from '../../game/explorer';
import { Depixelate } from '../../depixelate/depixelate.directive';

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
  imports: [RouterLink, NgOptimizedImage, GithubMark, QuestSprite, Depixelate],
  template: `
    <article class="container case-study">
      @if (project(); as p) {
        <header class="intro">
          <h1 [style.view-transition-name]="'title-' + p.slug">{{ p.title }}</h1>
          <p class="summary">{{ p.summary }}</p>
          <ul class="stack" i18n-aria-label="@@case.stack" aria-label="Technologies">
            @for (tech of p.stack; track tech) {
              <li>{{ tech }}</li>
            }
          </ul>
          @if (p.repos.length || p.demoUrl) {
            <p class="links">
              <!-- the code first when it is public, then the demo -->
              @for (repo of p.repos; track repo.url; let first = $first) {
                <a class="button" [class.button--primary]="first" [href]="repo.url" target="_blank" aria-describedby="new-tab" rel="noopener"><app-github-mark />{{ repo.label }}</a>
              }
              @if (p.demoUrl) {
                <a class="button" [class.button--primary]="!p.repos.length" [href]="p.demoUrl" target="_blank" aria-describedby="new-tab" rel="noopener" i18n="@@case.demo">Open the live demo</a>
              }
            </p>
          }
        </header>

        @if (p.image; as image) {
          <img appDepixelate class="shot" [class.shot--tall]="image.height > image.width" [ngSrc]="image.src" [ngSrcset]="image.width / 2 + 'w, ' + image.width + 'w'" [loaderParams]="{ full: image.width }" [sizes]="image.height > image.width ? '(min-width: 400px) 360px, 100vw' : '(min-width: 1024px) 960px, 100vw'" [width]="image.width" [height]="image.height" [alt]="image.alt" priority />
        } @else if (p.sprite; as sprite) {
          <!-- no screenshot: the project's pixel item, as in the work list -->
          <div class="item"><app-quest-sprite [name]="sprite" /></div>
        }

        <!-- desktop: the sections beside the text, the one being read lit like a node of the home's thread (issue #96) -->
        <nav class="toc" i18n-aria-label="@@case.toc" aria-label="On this page">
          <ul>
            <li><a [routerLink]="[]" fragment="context" [attr.aria-current]="current('context')" i18n="@@case.context">Context</a></li>
            <li><a [routerLink]="[]" fragment="architecture" [attr.aria-current]="current('architecture')" i18n="@@case.architecture">How it is built</a></li>
            <li><a [routerLink]="[]" fragment="decisions" [attr.aria-current]="current('decisions')" i18n="@@case.decisions">Key decisions</a></li>
            <li><a [routerLink]="[]" fragment="outcome" [attr.aria-current]="current('outcome')" i18n="@@case.outcome">Outcome</a></li>
          </ul>
        </nav>

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

        <!-- the next project, so a reader goes on without going back to the home (issue #91) -->
        <nav class="more" i18n-aria-label="@@case.more" aria-label="More projects">
          @if (next(); as n) {
            <a class="next" [routerLink]="['/work', n.slug]">
              <span class="next-label" i18n="@@case.next">Next project</span>
              <span class="next-title">{{ n.title }}</span>
            </a>
          }
          <a class="touch-line" routerLink="/" fragment="work" i18n="@@case.back">See all projects</a>
        </nav>
      } @else {
        <h1 i18n="@@case.notFound">Project not found</h1>
        <p><a routerLink="/" i18n="@@notFound.home">Go to the home page</a></p>
      }
    </article>
    <!-- the Explorer achievement (issue #133): announced on the visit that reads the last case study -->
    <p class="unlock band--ink" role="status">
      @if (unlocked()) {
        <app-quest-sprite name="map" />
        <span i18n="@@case.explorerUnlocked">Achievement unlocked: Explorer</span>
      }
    </p>
  `,
  styles: `
    @use 'styles/breakpoints' as bp;

    .unlock {
      position: fixed;
      inset: auto auto var(--space-2) var(--gutter);
      z-index: 50;
      display: flex;
      align-items: center;
      gap: var(--space-2);
      margin: 0;
      color: var(--fg);
      background: var(--band-bg);
      &:not(:empty) {
        padding: var(--space-1) var(--space-2);
        border: 4px solid var(--fg);
      }
      app-quest-sprite {
        width: 32px;
        height: 32px;
      }
      @media (prefers-reduced-motion: no-preference) {
        &:not(:empty) {
          animation: unlock 320ms steps(4);
        }
      }
    }
    @keyframes unlock {
      from {
        clip-path: inset(50% 0);
      }
    }

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
    .more {
      display: grid;
      justify-items: start;
      gap: var(--space-3);
      padding-top: var(--space-4);
      border-top: 1px solid var(--rule);
    }
    .next {
      display: grid;
      gap: var(--space-1);
      color: inherit;
      text-decoration: none;
    }
    .next-label {
      color: var(--fg-muted);
      font-size: var(--step--1);
    }
    .next-title {
      font-size: var(--step-3);
      font-weight: 600;
      font-variation-settings: 'wdth' 85;
      line-height: 1.1;
    }
    .next:hover .next-title {
      text-decoration: underline;
      text-decoration-thickness: 0.06em;
      text-underline-offset: 0.1em;
    }
    .toc {
      display: none;
    }
    @include bp.up(lg) {
      // the intro and the image across the page; the index in a narrow column, the sections and what follows beside it
      .case-study {
        grid-template-columns: 13rem minmax(0, 1fr);
      }
      .intro,
      .shot,
      .item {
        grid-column: 1 / -1;
      }
      section,
      .more {
        grid-column: 2;
      }
      .toc {
        display: block;
        grid-column: 1;
        grid-row: span 4;
        align-self: start;
        position: sticky;
        top: calc(var(--header-h) + var(--space-4));
      }
      .toc ul {
        display: grid;
        gap: var(--space-2);
        margin: 0;
        padding: 0;
        list-style: none;
      }
      .toc a {
        display: flex;
        align-items: center;
        gap: var(--space-1);
        color: var(--fg-muted);
        font-size: var(--step--1);
        text-decoration: none;
      }
      .toc a::before {
        content: '';
        flex: none;
        width: 8px;
        height: 8px;
        box-shadow: inset 0 0 0 2px currentColor;
      }
      .toc a:hover {
        color: var(--fg);
      }
      .toc a[aria-current] {
        color: var(--fg);
        font-weight: 600;
      }
      .toc a[aria-current]::before {
        background: var(--accent);
        box-shadow: none;
      }
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
    .item {
      display: grid;
      place-items: center;
      max-width: 480px;
      aspect-ratio: 3 / 2;
      border: 1px solid var(--rule);
      background: var(--surface);
    }
    .item app-quest-sprite {
      width: 36%;
      aspect-ratio: 1;
    }
  `,
})
export class CaseStudy {
  private readonly content = inject(CONTENT);
  readonly slug = input.required<string>();
  protected readonly project = computed(() => this.content.projects.find((p) => p.slug === this.slug()));
  /** The project after this one in the work list, the first after the last; none when the list has only this one. */
  protected readonly next = computed(() => {
    const { projects } = this.content;
    const i = projects.findIndex((p) => p.slug === this.slug());
    const n = projects[(i + 1) % projects.length];
    return i < 0 || n.slug === this.slug() ? undefined : n;
  });
  private readonly seo = inject(SeoService);
  private readonly locale = toLocale(inject(LOCALE_ID));

  /** The section being read, for the index (#96). */
  private readonly reading = signal<string | null>(null);
  /** The Explorer achievement was just earned: its notice shows for a few seconds. */
  protected readonly unlocked = signal(false);
  protected current(id: string): 'location' | null {
    return this.reading() === id ? 'location' : null;
  }

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const sections = [...host.querySelectorAll('section[id]')];
      const update = () => {
        const root = document.documentElement;
        const i = sectionBeingRead(
          sections.map((section) => section.getBoundingClientRect().top),
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
