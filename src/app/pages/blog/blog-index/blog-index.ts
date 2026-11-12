import { ChangeDetectionStrategy, Component, LOCALE_ID, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BLOG } from '../../../content/blog';
import { CONTENT } from '../../../content/content';
import { toLocale } from '../../../core/i18n/locale';
import { blogJsonLd } from '../../../core/seo/seo';
import { SeoService } from '../../../core/seo/seo.service';

/** The blog (issue #1, issue #315): every post, newest first. */
@Component({
  selector: 'app-blog-index',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './blog-index.html',
  styleUrl: './blog-index.scss',
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
