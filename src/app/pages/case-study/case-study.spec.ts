import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CaseStudy } from './case-study';

describe('CaseStudy', () => {
  async function render(slug: string) {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
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
    expect(labels).toEqual(['Open the live demo', 'Front-end code', 'Back-end code']);
  });

  it('shows no demo button for a project without a demo', async () => {
    const el = await render('mcp-server');
    expect(el.querySelector('.links .button--primary')).toBeNull();
    expect(el.querySelector('img')).toBeNull();
  });
});
