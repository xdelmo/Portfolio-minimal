import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  LOCALE_ID,
  ViewEncapsulation,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { BLOG } from '../../content/blog';
import { CONTENT } from '../../content/content';
import { toLocale } from '../../core/i18n/locale';
import { articleJsonLd } from '../../core/seo/seo';
import { SeoService } from '../../core/seo/seo.service';
import { ContactPrompt } from '../../layout/contact-prompt';
import { type Effect, MotionHost } from '../../motion/motion-host';
import { stickyEffect } from '../../motion/effects/sticky';
import { CodeBlock } from './code-block';

/**
 * A blog post (issue #1, issue #315). Its HTML is written at build time by scripts/blog.mjs from the repository's Markdown;
 * its code blocks come apart from it and are drawn by CodeBlock with a language tag and copy button (issue #191).
 */
@Component({
  selector: 'app-article',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [RouterLink, CodeBlock, ContactPrompt, MotionHost],
  template: `
    <div class="reading-progress" data-sticky [style.width.%]="progress()" aria-hidden="true"></div>
    <article class="container post" [appMotion]="effects">
      @if (article(); as a) {
        <header class="intro">
          <div class="breadcrumb-bar">
            <a routerLink="/blog" class="back-link touch-line" i18n="@@blog.backToAll">All posts</a>
          </div>
          <h1>{{ a.title }}</h1>
          <p class="byline">
            <span class="author-name">{{ content.person.name }}</span>
            <span class="meta-sep" aria-hidden="true">·</span>
            <span class="author-role">{{ content.person.role }}</span>
          </p>
          <div class="meta-row">
            <p class="meta">
              <time [attr.datetime]="a.date">{{ a.dateLabel }}</time>
              <span class="meta-sep" aria-hidden="true">/</span>
              <span i18n="@@blog.minutes">{{ a.minutes }} min read</span>
            </p>
            @if (canCopy()) {
              <button type="button" class="action-btn" [class.is-copied]="copied()" (click)="copyLink()">
                @if (copied()) {
                  <svg viewBox="0 0 8 8" width="14" height="14" shape-rendering="crispEdges" aria-hidden="true">
                    <path fill="currentColor" d="M7 1h1v2H7zM6 3h1v1H6zM5 4h1v1H5zM4 5h1v1H4zM3 6h1v1H3zM2 5h1v1H2zM1 4h1v1H1zM0 3h1v1H0z" />
                  </svg>
                  <span i18n="@@blog.linkCopied">Copied</span>
                } @else {
                  <svg viewBox="0 0 8 8" width="14" height="14" shape-rendering="crispEdges" aria-hidden="true">
                    <path fill="currentColor" fill-rule="evenodd" d="M0 0h6v1H1v5H0zM2 2h6v6H2zM3 3v4h4V3z" />
                  </svg>
                  <span i18n="@@blog.copyLink">Copy link</span>
                }
              </button>
              <span class="visually-hidden" role="status">
                @if (copied()) {
                  <span i18n="@@blog.linkCopiedStatus">Article link copied to clipboard</span>
                }
              </span>
            }
          </div>
        </header>
        <div class="prose">
          @for (part of a.parts; track $index) {
            @if (part.code !== undefined) {
              <app-code-block [code]="part.code" [lang]="part.lang" />
            } @else {
              <div class="run" [innerHTML]="part.html"></div>
            }
          }
        </div>
        @if (prevArticle() || nextArticle()) {
          <nav class="adjacent" aria-label="Adjacent articles" i18n-aria-label="@@blog.adjacent">
            @if (prevArticle(); as prev) {
              <a class="adjacent-card adjacent-card--prev" [routerLink]="['/blog', prev.slug]">
                <span class="adjacent-meta" i18n="@@blog.prevPost">Previous post</span>
                <span class="adjacent-title">{{ prev.title }}</span>
              </a>
            } @else {
              <div class="adjacent-empty" aria-hidden="true"></div>
            }
            @if (nextArticle(); as next) {
              <a class="adjacent-card adjacent-card--next" [routerLink]="['/blog', next.slug]">
                <span class="adjacent-meta" i18n="@@blog.nextPost">Next post</span>
                <span class="adjacent-title">{{ next.title }}</span>
              </a>
            } @else {
              <div class="adjacent-empty" aria-hidden="true"></div>
            }
          </nav>
        }
        <nav class="more" i18n-aria-label="@@blog.more" aria-label="After this post">
          @if (project(); as p) {
            <a class="next" [routerLink]="['/work', p.slug]">
              <span class="next-label" i18n="@@blog.project">The project behind it</span>
              <span class="next-title">{{ p.title }}</span>
            </a>
          }
          <app-contact-prompt />
          @if (a.linkedin) {
            <a class="repo-link" [href]="a.linkedin" target="_blank" aria-describedby="new-tab" rel="noopener" i18n="@@blog.linkedin">First posted on LinkedIn</a>
          }
          <a class="touch-line" routerLink="/blog" i18n="@@blog.all">All posts</a>
        </nav>
      } @else {
        <h1 i18n="@@blog.notFound">Post not found</h1>
        <p><a routerLink="/blog" i18n="@@blog.all">All posts</a></p>
      }
    </article>
  `,
  styles: `
    @use 'styles/breakpoints' as bp;

    app-article .reading-progress {
      position: sticky;
      top: 0;
      left: 0;
      width: 100%;
      height: 2px;
      background: var(--accent);
      z-index: 50;
      pointer-events: none;
      transition: width 100ms linear;
    }
    @media (prefers-reduced-motion: reduce) {
      app-article .reading-progress {
        display: none;
      }
    }
    app-article .post {
      display: grid;
      gap: var(--space-8);
      padding-block: var(--space-12) var(--space-16);
    }
    app-article .intro {
      display: grid;
      gap: var(--space-3);
    }
    app-article .breadcrumb-bar {
      margin-bottom: var(--space-1);
    }
    app-article .back-link {
      display: inline-flex;
      align-items: center;
      color: var(--link);
      font-size: var(--step--1);
      font-weight: 600;
      text-decoration: underline;
      text-underline-offset: 3px;
      text-decoration-thickness: 1px;
    }
    app-article .back-link:hover {
      text-decoration-thickness: 2px;
    }
    app-article h1 {
      margin: 0;
      line-height: 1.15;
    }
    app-article .byline {
      margin: 0;
      color: var(--fg-muted);
      font-size: var(--step--1);
    }
    app-article .author-name {
      color: var(--fg);
      font-weight: 600;
    }
    app-article .meta-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-2);
      max-width: var(--measure);
    }
    app-article .meta {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      margin: 0;
      color: var(--fg-muted);
      font-size: var(--step--1);
    }
    app-article .meta-sep {
      color: var(--rule);
    }
    app-article .action-btn {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      min-height: 32px;
      padding: 0 var(--space-1);
      border: 1px solid var(--rule);
      background: transparent;
      color: var(--fg-muted);
      font: inherit;
      font-size: var(--step--1);
      cursor: pointer;
      transition: color 120ms steps(2), border-color 120ms steps(2);
      &:hover {
        border-color: var(--fg);
        color: var(--fg);
      }
      &.is-copied {
        border-color: var(--accent);
        background: var(--accent);
        color: var(--on-accent);
      }
      @media (pointer: coarse) {
        min-height: 44px;
      }
    }
    app-article .prose {
      display: grid;
      gap: var(--space-4);
      min-width: 0;
      line-height: 1.6;
    }
    // the runs of HTML lay their paragraphs out in the prose's grid, beside the code blocks
    app-article .prose > .run {
      display: contents;
    }
    app-article .prose > .run > * {
      max-width: var(--measure);
      margin: 0;
    }
    app-article .prose > app-code-block {
      max-width: var(--measure);
      margin: 0;
      width: 100%;
    }
    @include bp.up(md) {
      app-article .prose > app-code-block {
        max-width: 72ch;
      }
    }
    app-article .prose h2 {
      margin-top: var(--space-6);
      font-size: var(--step-3);
      line-height: 1.2;
    }
    app-article .prose h3 {
      margin-top: var(--space-4);
      font-size: var(--step-1);
      line-height: 1.25;
    }
    app-article .prose ul,
    app-article .prose ol {
      display: grid;
      gap: var(--space-1);
      padding-left: var(--space-3);
    }
    // inline code: a quiet tint, no rounded pill
    app-article .prose .run code {
      padding: 0 0.25em;
      background: var(--surface);
      font-family: var(--font-mono);
      font-size: 0.875em;
    }
    app-article .prose blockquote {
      padding-left: var(--space-2);
      border-left: 2px solid var(--accent-line);
      color: var(--fg-muted);
      font-style: italic;
    }
    app-article .adjacent {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-3);
      max-width: var(--measure);
      padding-top: var(--space-6);
      border-top: 1px solid var(--rule);
    }
    @media (max-width: 640px) {
      app-article .adjacent {
        grid-template-columns: 1fr;
      }
    }
    app-article .adjacent-card {
      display: grid;
      gap: var(--space-1);
      padding: var(--space-2);
      border: 1px solid var(--rule);
      color: inherit;
      text-decoration: none;
      background: var(--surface);
      transition: border-color 120ms steps(2);
      &:hover {
        border-color: var(--fg);
        .adjacent-title {
          text-decoration: underline;
          text-decoration-thickness: 2px;
          text-underline-offset: 3px;
        }
      }
      &:active {
        transform: translate(2px, 2px);
      }
    }
    app-article .adjacent-meta {
      font-size: var(--step--1);
      color: var(--fg-muted);
    }
    app-article .adjacent-title {
      font-size: var(--step-0);
      font-weight: 600;
      line-height: 1.25;
    }
    app-article .adjacent-empty {
      display: none;
    }
    @media (min-width: 641px) {
      app-article .adjacent-empty {
        display: block;
        visibility: hidden;
      }
      app-article .adjacent-card--next {
        text-align: right;
      }
    }
    app-article .more {
      display: grid;
      justify-items: start;
      gap: var(--space-3);
      max-width: var(--measure);
      padding-top: var(--space-4);
      border-top: 1px solid var(--rule);
    }
    app-article .next {
      display: grid;
      gap: var(--space-1);
      color: inherit;
      text-decoration: none;
      &:hover .next-title {
        text-decoration: underline;
        text-decoration-thickness: 0.06em;
        text-underline-offset: 0.1em;
      }
    }
    app-article .next-label {
      color: var(--fg-muted);
      font-size: var(--step--1);
    }
    app-article .next-title {
      font-size: var(--step-3);
      font-weight: 600;
      font-variation-settings: 'wdth' 85;
      line-height: 1.1;
    }
  `,
})
export class ArticlePage {
  private readonly articles = inject(BLOG);
  protected readonly content = inject(CONTENT);
  readonly slug = input.required<string>();
  protected readonly effects: readonly Effect[] = [stickyEffect];
  protected readonly article = computed(() => this.articles.find((a) => a.slug === this.slug()));
  protected readonly project = computed(() => this.content.projects.find((p) => p.slug === this.article()?.project));
  protected readonly prevArticle = computed(() => {
    const list = this.articles;
    const i = list.findIndex((a) => a.slug === this.slug());
    return i >= 0 && i < list.length - 1 ? list[i + 1] : undefined;
  });
  protected readonly nextArticle = computed(() => {
    const list = this.articles;
    const i = list.findIndex((a) => a.slug === this.slug());
    return i > 0 ? list[i - 1] : undefined;
  });

  protected readonly progress = signal(0);
  protected readonly canCopy = signal(false);
  protected readonly copied = signal(false);
  private copyTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    const seo = inject(SeoService);
    const locale = toLocale(inject(LOCALE_ID));
    const destroyRef = inject(DestroyRef);
    effect(() => {
      const a = this.article();
      seo.setJsonLd('ld-page', a ? articleJsonLd(a, this.content.person, locale) : null);
      seo.update(
        a
          ? { path: `/blog/${a.slug}`, title: `${a.title} — ${this.content.person.name}`, description: a.description, ogImage: `blog-${a.slug}` }
          : { path: `/blog/${this.slug()}`, title: $localize`:@@notFound.pageTitle:Page not found — Emanuele Del Monte`, description: '', noindex: true },
      );
    });

    afterNextRender(() => {
      this.canCopy.set(typeof (navigator.clipboard as Clipboard | undefined)?.writeText === 'function');
      const updateProgress = () => {
        const el = document.documentElement;
        const total = el.scrollHeight - window.innerHeight;
        if (total <= 0) {
          this.progress.set(0);
          return;
        }
        const p = Math.min(100, Math.max(0, (window.scrollY / total) * 100));
        this.progress.set(Math.round(p));
      };
      window.addEventListener('scroll', updateProgress, { passive: true });
      destroyRef.onDestroy(() => {
        window.removeEventListener('scroll', updateProgress);
        clearTimeout(this.copyTimer);
      });
    });
  }

  protected async copyLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      return;
    }
    this.copied.set(true);
    clearTimeout(this.copyTimer);
    this.copyTimer = setTimeout(() => {
      this.copied.set(false);
    }, 2000);
  }
}
