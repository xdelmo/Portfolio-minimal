import { IMAGE_LOADER } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { BLOG } from './content/blog';
import { CONTENT } from './content/content';
import { CONTENT_EN } from './content/content.en';
import { workImageLoader } from './content/image-loader';

describe('app routes', () => {
  async function navigate(url: string) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        { provide: IMAGE_LOADER, useValue: workImageLoader },
        { provide: CONTENT, useValue: CONTENT_EN },
        { provide: BLOG, useValue: [{ slug: 'server-side-tables', title: 'Ten records is easy, ten thousand is engineering', description: 'Notes on tables.', date: '2026-03-02', dateLabel: '2 March 2026', minutes: 4, parts: [{ html: '<p>Body.</p>' }] }] },
      ],
    });
    const harness = await RouterTestingHarness.create(url);
    const el = harness.routeNativeElement;
    if (!el) throw new Error('missing route element');
    return {
      el,
      router: TestBed.inject(Router),
      title: TestBed.inject(Title),
    };
  }

  it('renders CaseStudy for a known project slug', async () => {
    const { el, router } = await navigate('/work/apexflow');
    expect(router.url).toBe('/work/apexflow');
    expect(el.querySelector('h1')?.textContent).toContain('ApexFlow');
  });

  it('falls through to NotFound for an unknown project slug', async () => {
    const { el, router, title } = await navigate('/work/apexflw');
    expect(router.url).toBe('/work/apexflw');
    expect(el.querySelector('h1')?.textContent).toContain('A wild 404 appeared!');
    expect(title.getTitle()).toBe('Page not found — Emanuele Del Monte');
    expect(document.head.querySelector('meta[name="description"]')).toBeNull();
  });

  it('renders ArticlePage for a known blog slug', async () => {
    const { el, router } = await navigate('/blog/server-side-tables');
    expect(router.url).toBe('/blog/server-side-tables');
    expect(el.querySelector('h1')?.textContent).toContain('Ten records is easy');
  });

  it('falls through to NotFound for an unknown blog slug', async () => {
    const { el, router, title } = await navigate('/blog/unknown-slug');
    expect(router.url).toBe('/blog/unknown-slug');
    expect(el.querySelector('h1')?.textContent).toContain('A wild 404 appeared!');
    expect(title.getTitle()).toBe('Page not found — Emanuele Del Monte');
  });
});
