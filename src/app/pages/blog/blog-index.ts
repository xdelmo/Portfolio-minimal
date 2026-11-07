import { ChangeDetectionStrategy, Component, LOCALE_ID, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BLOG } from '../../content/blog';
import { CONTENT } from '../../content/content';
import { toLocale } from '../../core/i18n/locale';
import { blogJsonLd } from '../../core/seo/seo';
import { SeoService } from '../../core/seo/seo.service';

/** The blog (issue #1, issue #315): every post, newest first. */
@Component({
  selector: 'app-blog-index',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="container blog">
      <header class="intro">
        <h1 i18n="@@blog.title">Blog</h1>
        <p class="lede" i18n="@@blog.lede">Notes from building Angular frontends: what I tried, what broke, what I would do again.</p>
      </header>
      <ol class="posts">
        @for (post of articles; track post.slug) {
          <li class="post-item">
            <div class="post-meta-row">
              <p class="meta">
                <time [attr.datetime]="post.date">{{ post.dateLabel }}</time>
                <span class="meta-sep" aria-hidden="true">/</span>
                <span i18n="@@blog.minutes">{{ post.minutes }} min read</span>
              </p>
              @if (post.project) {
                <a class="project-tag" [routerLink]="['/work', post.project]">
                  {{ post.project }}
                </a>
              }
            </div>
            <h2><a class="title-link" [routerLink]="['/blog', post.slug]">{{ post.title }}</a></h2>
            <p class="desc">{{ post.description }}</p>
            <div class="post-action">
              <a class="read-link touch-line" [routerLink]="['/blog', post.slug]" i18n="@@blog.readMore">Read article</a>
            </div>
          </li>
        }
      </ol>
    </div>
  `,
  styles: `
    .blog {
      display: grid;
      gap: var(--space-8);
      padding-block: var(--space-12) var(--space-16);
    }
    .intro {
      display: grid;
      gap: var(--space-3);
    }
    .lede {
      max-width: 56ch;
      margin: 0;
      font-size: var(--step-1);
    }
    .posts {
      display: grid;
      gap: var(--space-6);
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .post-item {
      display: grid;
      gap: var(--space-2);
      padding-top: var(--space-4);
      border-top: 1px solid var(--rule);
      transition: border-color 120ms steps(2);
    }
    .post-item:hover {
      border-top-color: var(--fg);
    }
    .post-item > * {
      max-width: var(--measure);
      margin: 0;
    }
    .post-meta-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-2);
    }
    .meta {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      color: var(--fg-muted);
      font-size: var(--step--1);
      margin: 0;
    }
    .meta-sep {
      color: var(--rule);
    }
    .project-tag {
      display: inline-flex;
      align-items: center;
      min-height: 28px;
      padding: 0 var(--space-1);
      border: 1px solid var(--rule);
      color: var(--fg-muted);
      font-size: var(--step--2);
      font-family: var(--font-mono);
      font-weight: 600;
      text-decoration: none;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      transition: color 120ms steps(2), border-color 120ms steps(2);
    }
    @media (pointer: coarse) {
      .project-tag {
        min-height: 44px;
      }
    }
    .project-tag:hover {
      border-color: var(--fg);
      color: var(--fg);
    }
    h2 {
      font-size: var(--step-2);
      margin: 0;
      line-height: 1.2;
    }
    .title-link {
      color: var(--fg);
      text-decoration: none;
    }
    .title-link:hover {
      text-decoration: underline;
      text-decoration-thickness: 2px;
      text-underline-offset: 4px;
    }
    .desc {
      color: var(--fg-muted);
      line-height: 1.55;
      margin: 0;
    }
    .post-action {
      margin-top: var(--space-1);
    }
    .read-link {
      display: inline-block;
      font-size: var(--step--1);
      font-weight: 600;
      color: var(--link);
      text-decoration: underline;
      text-underline-offset: 3px;
      text-decoration-thickness: 1px;
    }
    .read-link:hover {
      text-decoration-thickness: 2px;
    }
  `,
})
export class BlogIndex {
  protected readonly articles = inject(BLOG);

  constructor() {
    const seo = inject(SeoService);
    const { person } = inject(CONTENT);
    seo.update({ path: '/blog', title: `Blog — ${person.name}`, description: $localize`:@@blog.description:Notes on Angular, Signals, RxJS and Spring Boot by ${person.name}:name:.`, ogImage: 'blog' });
    seo.setJsonLd('ld-page', blogJsonLd(this.articles, person, toLocale(inject(LOCALE_ID))));
  }
}
