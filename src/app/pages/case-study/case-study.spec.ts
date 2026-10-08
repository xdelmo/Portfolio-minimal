import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CONTENT } from '../../content/content';
import { CONTENT_EN } from '../../content/content.en';
import { CaseStudy } from './case-study';

describe('CaseStudy', () => {
  async function render(slug: string) {
    // every link, whatever GitHub answers today: the page is under test, not which repositories are public
    TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: CONTENT, useValue: CONTENT_EN }] });
    const fixture = TestBed.createComponent(CaseStudy);
    fixture.componentRef.setInput('slug', slug);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows the project for a known slug', async () => {
    const el = await render('apexflow');
    expect(el.querySelector('h1')?.textContent).toContain('ApexFlow');
    expect(el.querySelector('a[href="https://dashboard-tesi.vercel.app/welcome"]')).not.toBeNull();
  });

  it('shows a not-found message with a link home for an unknown slug', async () => {
    const el = await render('apexflw');
    expect(el.querySelector('h1')?.textContent).toContain('not found');
    expect(el.querySelector('a[href="/"]')).not.toBeNull();
  });

  it('renders the case study sections in order', async () => {
    const el = await render('apexflow');
    const headings = [...el.querySelectorAll('h2')].map((h) => h.textContent.trim());
    expect(headings).toEqual(['Context', 'How it is built', 'Key decisions', 'Outcome']);
    expect(el.querySelectorAll('#decisions h3')).toHaveLength(3);
  });

  it('labels each repository link', async () => {
    const el = await render('apexflow');
    const labels = [...el.querySelectorAll('.links a')].map((a) => a.textContent.trim());
    expect(labels).toEqual(['Front-end code', 'Back-end code', 'Open the live demo']);
  });

  it('leads with the demo when no code is public, and drops the row when there is neither', async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: CONTENT, useValue: { ...CONTENT_EN, projects: CONTENT_EN.projects.map((p) => ({ ...p, repos: [] })) } }],
    });
    const fixture = TestBed.createComponent(CaseStudy);
    fixture.componentRef.setInput('slug', 'ice-friends-breaker');
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect([...el.querySelectorAll('.links a')].map((a) => [a.textContent.trim(), a.classList.contains('button--primary')])).toEqual([['Open the live demo', true]]);
    fixture.componentRef.setInput('slug', 'telegram-bots');
    await fixture.whenStable();
    expect(el.querySelector('.links')).toBeNull();
  });

  it('shows no demo button for a project without a demo', async () => {
    const el = await render('mcp-server');
    expect([...el.querySelectorAll('.links a')].map((a) => a.textContent.trim())).toEqual(['Code on GitHub']);
    expect(el.querySelector('img')).toBeNull();
  });
});
