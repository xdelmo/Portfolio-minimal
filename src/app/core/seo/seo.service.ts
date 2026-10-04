import { DOCUMENT, Injectable, LOCALE_ID, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { toLocale } from '../i18n/locale';
import { SITE_URL, headLinks, markdownPath, pageUrl } from './seo';

export interface PageSeo {
  path: string;
  title: string;
  description: string;
  noindex?: boolean;
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly doc = inject(DOCUMENT);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly locale = toLocale(inject(LOCALE_ID));

  update(page: PageSeo): void {
    const url = pageUrl(page.path, this.locale);
    this.title.setTitle(page.title);
    this.meta.updateTag({ name: 'description', content: page.description });
    this.meta.updateTag({ name: 'robots', content: page.noindex ? 'noindex' : 'index,follow' });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:title', content: page.title });
    this.meta.updateTag({ property: 'og:description', content: page.description });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:locale', content: this.locale === 'it' ? 'it_IT' : 'en_US' });
    this.meta.updateTag({ property: 'og:locale:alternate', content: this.locale === 'it' ? 'en_US' : 'it_IT' });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });

    this.doc.head.querySelectorAll('link[data-seo]').forEach((el) => {
      el.remove();
    });
    if (page.noindex) return;
    for (const link of headLinks(page.path, this.locale)) {
      this.addLink({ rel: link.rel, href: link.href, ...(link.hreflang ? { hreflang: link.hreflang } : {}) });
    }
    this.addLink({ rel: 'alternate', type: 'text/markdown', href: `${SITE_URL}${markdownPath(page.path, this.locale)}` });
  }

  private addLink(attrs: Record<string, string>): void {
    const el = this.doc.createElement('link');
    for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
    el.setAttribute('data-seo', '');
    this.doc.head.appendChild(el);
  }

  setJsonLd(id: string, data: Record<string, unknown> | null): void {
    this.doc.getElementById(id)?.remove();
    if (!data) return;
    const script = this.doc.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    this.doc.head.appendChild(script);
  }
}
