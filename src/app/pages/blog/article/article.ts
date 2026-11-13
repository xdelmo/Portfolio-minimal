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
import { BLOG } from '../../../content/blog';
import { CONTENT } from '../../../content/content';
import { toLocale } from '../../../core/i18n/locale';
import { articleJsonLd } from '../../../core/seo/seo';
import { SeoService } from '../../../core/seo/seo.service';
import { ContactPrompt } from '../../../layout/contact-prompt';
import { type Effect, MotionHost } from '../../../motion/motion-host';
import { stickyEffect } from '../../../motion/effects/sticky';
import { CodeBlock } from '../code-block/code-block';

/**
 * A blog post (issue #1, issue #315). Its HTML is written at build time by scripts/blog.mjs from the repository's Markdown;
 * its code blocks come apart from it and are drawn by CodeBlock with a language tag and copy button (issue #191).
 */
@Component({
  selector: 'app-article',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [RouterLink, CodeBlock, ContactPrompt, MotionHost],
  templateUrl: './article.html',
  styleUrl: './article.scss',
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
