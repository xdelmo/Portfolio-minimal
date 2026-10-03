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
    expect(links).toEqual(['/work/apexflow', '/work/ice-friends-breaker', '/work/mcp-server', '/work/telegram-bots']);
  });

  it('shows an image with alt text only for projects that have one', async () => {
    const el = await render();
    const imgs = [...el.querySelectorAll('img')];
    expect(imgs.map((i) => i.getAttribute('alt'))).toEqual([
      CONTENT_EN.projects[0].image?.alt,
      CONTENT_EN.projects[1].image?.alt,
    ]);
  });

  it('lists the stack of each project', async () => {
    const el = await render();
    expect(el.querySelectorAll('li.project')[0].textContent).toContain('Spring Boot');
  });
});
