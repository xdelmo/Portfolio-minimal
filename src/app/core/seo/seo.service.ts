import { DOCUMENT, Injectable, LOCALE_ID, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { toLocale } from '../i18n/locale';
import { SITE_NAME, SITE_URL, headLinks, markdownPath, ogImageUrl, pageUrl } from './seo';

export interface PageSeo {
  path: string;
  title: string;
  description: string;
  noindex?: boolean;
  /** 'home' or a project slug, see ogImageUrl */
  ogImage?: string;
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
    // no empty description: a page without one (the 404) says nothing rather than an empty string (issue #114)
    for (const [attr, name] of [['name', 'description'], ['property', 'og:description']] as const) {
      if (page.description) this.meta.updateTag({ [attr]: name, content: page.description });
      else this.meta.removeTag(`${attr}='${name}'`);
    }
    this.meta.updateTag({ name: 'robots', content: page.noindex ? 'noindex' : 'index,follow' });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:title', content: page.title });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:site_name', content: SITE_NAME });
    this.meta.updateTag({ property: 'og:locale', content: this.locale === 'it' ? 'it_IT' : 'en_US' });
    this.meta.updateTag({ property: 'og:locale:alternate', content: this.locale === 'it' ? 'en_US' : 'it_IT' });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    if (page.ogImage) {
      const image = ogImageUrl(page.ogImage, this.locale);
      this.meta.updateTag({ property: 'og:image', content: image });
      this.meta.updateTag({ property: 'og:image:width', content: '1200' });
      this.meta.updateTag({ property: 'og:image:height', content: '630' });
      this.meta.updateTag({ property: 'og:image:alt', content: page.title });
      this.meta.updateTag({ name: 'twitter:image', content: image });
    } else {
      for (const selector of ["property='og:image'", "property='og:image:width'", "property='og:image:height'", "property='og:image:alt'", "name='twitter:image'"]) {
        this.meta.removeTag(selector);
      }
    }

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
