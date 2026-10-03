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
});
