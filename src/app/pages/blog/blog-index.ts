import { ChangeDetectionStrategy, Component, LOCALE_ID, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BLOG } from '../../content/blog';
import { CONTENT } from '../../content/content';
import { toLocale } from '../../core/i18n/locale';
import { blogJsonLd } from '../../core/seo/seo';
import { SeoService } from '../../core/seo/seo.service';

/** The blog (issue #1): every post, newest first. */
@Component({
  selector: 'app-blog-index',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="container blog">
      <header class="intro">
        <h1 i18n="@@blog.title">Blog</h1>
        <p class="lede" i18n="@@blog.lede">Notes from building Angular front ends: what I tried, what broke, what I would do again.</p>
      </header>
      <ol class="posts">
        @for (post of articles; track post.slug) {
          <li>
            <h2><a [routerLink]="['/blog', post.slug]">{{ post.title }}</a></h2>
            <p class="meta"><time [attr.datetime]="post.date">{{ post.dateLabel }}</time>, <span i18n="@@blog.minutes">{{ post.minutes }} min read</span></p>
            <p>{{ post.description }}</p>
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
    li {
      display: grid;
      gap: var(--space-1);
      padding-top: var(--space-3);
      border-top: 1px solid var(--rule);
    }
    li > * {
      max-width: var(--measure);
      margin: 0;
    }
    h2 {
      font-size: var(--step-2);
    }
    .meta {
      color: var(--fg-muted);
      font-size: var(--step--1);
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
