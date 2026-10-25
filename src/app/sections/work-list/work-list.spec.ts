import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CONTENT_EN } from '../../content/content.en';
import { WorkList } from './work-list';

describe('WorkList', () => {
  async function render() {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(WorkList);
    fixture.componentRef.setInput('projects', CONTENT_EN.projects);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('renders one item per project with a link to its case study', async () => {
    const el = await render();
    const links = [...el.querySelectorAll('h3 a')].map((a) => a.getAttribute('href'));
    expect(links).toEqual(['/work/apexflow', '/work/pokeverba', '/work/wedding-3d-invite']);
  });

  it('shows an image with alt text only for projects that have one', async () => {
    const el = await render();
    const imgs = [...el.querySelectorAll('img.shot')];
    expect(imgs.map((i) => i.getAttribute('alt'))).toEqual(CONTENT_EN.projects.flatMap((p) => (p.image ? [p.image.alt] : [])));
  });

  it('lists the stack of each project', async () => {
    const el = await render();
    expect(el.querySelectorAll('li.project')[0].textContent).toContain('Spring Boot');
  });

  // issue #231: whose project it is, and the demo, already in the list
  it('says whose project each one is and links its live demo when there is one', async () => {
    const el = await render();
    const items = [...el.querySelectorAll('li.project')];
    CONTENT_EN.projects.forEach((project, i) => {
      expect(items[i].querySelector('.role')?.textContent).toBe(project.role);
      const demo = items[i].querySelector<HTMLAnchorElement>('a[target="_blank"]:not([href*="github.com"])');
      expect(demo?.getAttribute('href') ?? undefined).toBe(project.demoUrl);
    });
  });
});
