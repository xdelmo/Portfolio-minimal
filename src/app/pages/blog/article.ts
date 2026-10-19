import { ChangeDetectionStrategy, Component, LOCALE_ID, ViewEncapsulation, computed, effect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BLOG } from '../../content/blog';
import { CONTENT } from '../../content/content';
import { toLocale } from '../../core/i18n/locale';
import { articleJsonLd } from '../../core/seo/seo';
import { SeoService } from '../../core/seo/seo.service';
import { ContactPrompt } from '../../layout/contact-prompt';
import { CodeBlock } from './code-block';

/**
 * A blog post (issue #1). Its HTML is written at build time by scripts/blog.mjs from the repository's Markdown; its code
 * blocks come apart from it and are drawn by CodeBlock, with their copy button (issue #191).
 */
@Component({
  selector: 'app-article',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // unscoped: the post's elements come from [innerHTML], outside Angular's templates; every rule starts at app-article
  encapsulation: ViewEncapsulation.None,
  imports: [RouterLink, CodeBlock, ContactPrompt],
  template: `
    <article class="container post">
      @if (article(); as a) {
        <header class="intro">
          <h1>{{ a.title }}</h1>
          <p class="meta"><time [attr.datetime]="a.date">{{ a.dateLabel }}</time>, <span i18n="@@blog.minutes">{{ a.minutes }} min read</span></p>
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
        <nav class="more" i18n-aria-label="@@blog.more" aria-label="After this post">
          <app-contact-prompt />
          @if (project(); as p) {
            <a class="next" [routerLink]="['/work', p.slug]">
              <span class="next-label" i18n="@@blog.project">The project behind it</span>
              <span class="next-title">{{ p.title }}</span>
            </a>
          }
          @if (a.linkedin) {
            <a [href]="a.linkedin" target="_blank" aria-describedby="new-tab" rel="noopener" i18n="@@blog.linkedin">First posted on LinkedIn</a>
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
    app-article .post {
      display: grid;
      gap: var(--space-8);
      padding-block: var(--space-12) var(--space-16);
    }
    app-article .intro {
      display: grid;
      gap: var(--space-2);
    }
    app-article .meta {
      margin: 0;
      color: var(--fg-muted);
      font-size: var(--step--1);
    }
    app-article .prose {
      display: grid;
      gap: var(--space-3);
      min-width: 0;
    }
    // the runs of HTML lay their paragraphs out in the prose's grid, beside the code blocks
    app-article .prose > .run {
      display: contents;
    }
    app-article .prose > .run > *,
    app-article .prose > app-code-block {
      max-width: var(--measure);
      margin: 0;
    }
    app-article .prose h2 {
      margin-top: var(--space-4);
      font-size: var(--step-3);
    }
    app-article .prose h3 {
      margin-top: var(--space-2);
      font-size: var(--step-1);
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
      font-family: ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace;
      font-size: 0.875em;
    }
    app-article .prose blockquote {
      padding-left: var(--space-2);
      border-left: 4px solid var(--accent);
      color: var(--fg-muted);
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
    app-article .next:hover .next-title {
      text-decoration: underline;
      text-decoration-thickness: 0.06em;
      text-underline-offset: 0.1em;
    }
  `,
})
export class ArticlePage {
  private readonly articles = inject(BLOG);
  private readonly content = inject(CONTENT);
  readonly slug = input.required<string>();
  protected readonly article = computed(() => this.articles.find((a) => a.slug === this.slug()));
  protected readonly project = computed(() => this.content.projects.find((p) => p.slug === this.article()?.project));

  constructor() {
    const seo = inject(SeoService);
    const locale = toLocale(inject(LOCALE_ID));
    effect(() => {
      const a = this.article();
      seo.setJsonLd('ld-page', a ? articleJsonLd(a, this.content.person, locale) : null);
      seo.update(
        a
          ? { path: `/blog/${a.slug}`, title: `${a.title} — ${this.content.person.name}`, description: a.description, ogImage: `blog-${a.slug}` }
          : { path: `/blog/${this.slug()}`, title: $localize`:@@notFound.pageTitle:Page not found — Emanuele Del Monte`, description: '', noindex: true },
      );
    });
  }
}
