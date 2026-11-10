import { TestBed } from '@angular/core/testing';
import { testProviders } from '../../../testing/test-providers';
import { Title } from '@angular/platform-browser';
import { ArticlePage } from './article';
import { BlogIndex } from './blog-index';
import { CodeBlock } from './code-block';

describe('BlogIndex', () => {
  it('renders all blog articles with dates, reading time and read-link', async () => {
    TestBed.configureTestingModule({
      providers: testProviders(),
    });
    const fixture = TestBed.createComponent(BlogIndex);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('h1')?.textContent).toContain('Blog');
    const items = el.querySelectorAll('.posts li');
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].querySelector('time')).not.toBeNull();
    expect(items[0].querySelector('.read-link')).not.toBeNull();
  });
});

describe('ArticlePage', () => {
  async function render(slug: string) {
    TestBed.configureTestingModule({
      providers: testProviders(),
    });
    const fixture = TestBed.createComponent(ArticlePage);
    fixture.componentRef.setInput('slug', slug);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('renders a known article with title, date, reading progress and adjacent navigation', async () => {
    const { el } = await render('server-side-tables');
    expect(el.querySelector('h1')?.textContent).toContain('Ten records is easy');
    expect(el.querySelector('.reading-progress')).not.toBeNull();
    expect(el.querySelector('.back-link')).not.toBeNull();
    expect(el.querySelector('.adjacent')).not.toBeNull();
  });

  it('shows not found when given an unknown slug', async () => {
    const { el } = await render('unknown-slug');
    expect(el.querySelector('h1')?.textContent).toContain('Post not found');
    expect(TestBed.inject(Title).getTitle()).toContain('Page not found');
  });
});

describe('CodeBlock', () => {
  it('renders language tag and pre formatted code', async () => {
    TestBed.configureTestingModule({});
    const fixture = TestBed.createComponent(CodeBlock);
    fixture.componentRef.setInput('code', 'const x = 42;');
    fixture.componentRef.setInput('lang', 'ts');
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.lang-tag')?.textContent).toBe('ts');
    expect(el.querySelector('pre code')?.textContent).toBe('const x = 42;');
    expect(el.querySelector('code')?.classList).toContain('language-ts');
  });
});
