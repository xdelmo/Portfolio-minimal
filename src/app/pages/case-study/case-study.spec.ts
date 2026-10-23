import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { CONTENT } from '../../content/content';
import { CONTENT_EN } from '../../content/content.en';
import { CaseStudy, sectionBeingRead } from './case-study';

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
    // the tab and the history say so too, and no empty description is left in the head (issue #114)
    expect(TestBed.inject(Title).getTitle()).toBe('Page not found — Emanuele Del Monte');
    expect(document.head.querySelector('meta[name="description"]')).toBeNull();
    expect(el.querySelector('a[href="/"]')).not.toBeNull();
  });

  it('renders the case study sections in order', async () => {
    const el = await render('apexflow');
    const headings = [...el.querySelectorAll('h2')].map((h) => h.textContent.trim());
    // ApexFlow has blog posts (issue #1): they close the case study
    expect(headings).toEqual(['Context', 'How it is built', 'Key decisions', 'Outcome', 'I wrote about it']);
    expect(el.querySelectorAll('#decisions h3')).toHaveLength(3);
  });

  it('says whose project it is before the details, and ends with a way to get in touch (#229)', async () => {
    const el = await render('apexflow');
    expect(el.querySelector('.intro .role')?.textContent).toBe(CONTENT_EN.projects[0].role);
    const contact = el.querySelector('.more app-contact-prompt a');
    expect(contact?.getAttribute('href')).toBe(`mailto:${CONTENT_EN.person.email}`);
    expect(contact?.classList).toContain('button--primary');
  });

  it('has no posts section for a project nobody wrote about (#1)', async () => {
    const el = await render('pokeverba');
    expect([...el.querySelectorAll('h2')].map((h) => h.textContent.trim())).not.toContain('I wrote about it');
  });

  it('ends with the next project in the work list (#91)', async () => {
    const [first, second] = CONTENT_EN.projects;
    const el = await render(first.slug);
    expect(el.querySelector('.next')?.getAttribute('href')).toBe(`/work/${second.slug}`);
    expect(el.querySelector('.next-title')?.textContent).toBe(second.title);
  });

  it('leads from the last project back to the first', async () => {
    const { projects } = CONTENT_EN;
    const el = await render(projects[projects.length - 1].slug);
    expect(el.querySelector('.next')?.getAttribute('href')).toBe(`/work/${projects[0].slug}`);
  });

  it('lists the sections in an index (#96)', async () => {
    const el = await render('apexflow');
    const links = [...el.querySelectorAll('.toc a')];
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['/#context', '/#architecture', '/#decisions', '/#outcome']);
  });

  it('labels each repository link', async () => {
    const el = await render('apexflow');
    const labels = [...el.querySelectorAll('.links a')].map((a) => a.textContent.trim());
    expect(labels).toEqual(['Front-end code', 'Back-end code', 'Open the live demo']);
  });

  it('leads with the demo when no code is public, and drops the row when there is neither', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        // no public code anywhere, and PokèVerba without its demo either (nor screenshots: only the links are under test)
        { provide: CONTENT, useValue: { ...CONTENT_EN, projects: CONTENT_EN.projects.map((p) => ({ ...p, repos: [], image: undefined, demoUrl: p.slug === 'pokeverba' ? undefined : p.demoUrl })) } },
      ],
    });
    const fixture = TestBed.createComponent(CaseStudy);
    fixture.componentRef.setInput('slug', 'ice-friends-breaker');
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect([...el.querySelectorAll('.links a')].map((a) => [a.textContent.trim(), a.classList.contains('button--primary')])).toEqual([['Open the live demo', true]]);
    fixture.componentRef.setInput('slug', 'pokeverba');
    await fixture.whenStable();
    expect(el.querySelector('.links')).toBeNull();
  });

  it('shows the pixel item for a project without a screenshot', async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: CONTENT, useValue: { ...CONTENT_EN, projects: CONTENT_EN.projects.map((p) => ({ ...p, image: undefined })) } }],
    });
    const fixture = TestBed.createComponent(CaseStudy);
    fixture.componentRef.setInput('slug', 'pokeverba');
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect([...el.querySelectorAll('.links a')].map((a) => a.textContent.trim())).toEqual(['Code on GitHub', 'Open the live demo']);
    expect(el.querySelector('img')).toBeNull();
    expect(el.querySelector('.item app-quest-sprite')).not.toBeNull();
  });
});

describe('sectionBeingRead', () => {
  it('is the last section whose top has passed the line', () => {
    expect(sectionBeingRead([-900, -200, 150, 700], 250, false)).toBe(2);
  });
  it('is none above the first section', () => {
    expect(sectionBeingRead([400, 900], 250, false)).toBe(-1);
  });
  it('is the last section at the end of the page, even if it never reached the line', () => {
    expect(sectionBeingRead([-900, -200, 150, 500], 250, true)).toBe(3);
  });
});
