import { TestBed } from '@angular/core/testing';
import { testProviders } from '../../../testing/test-providers';
import { CONTENT_EN } from '../../content/content.en';
import { WorkList } from './work-list';

describe('WorkList', () => {
  async function render() {
    TestBed.configureTestingModule({ providers: testProviders() });
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

  // issue #340: media container links to case study and holds magnetic arrow
  it('renders a media link to the case study with aria-hidden and tabindex -1', async () => {
    const el = await render();
    const mediaLinks = [...el.querySelectorAll('a.media')];
    expect(mediaLinks.map((a) => a.getAttribute('href'))).toEqual(['/work/apexflow', '/work/pokeverba', '/work/wedding-3d-invite']);
    for (const a of mediaLinks) {
      expect(a.getAttribute('tabindex')).toBe('-1');
      expect(a.getAttribute('aria-hidden')).toBe('true');
    }
  });

  it('renders an arrow button with data-magnetic on each media frame', async () => {
    const el = await render();
    const arrows = [...el.querySelectorAll('.media .media-arrow')];
    expect(arrows.length).toBe(3);
    for (const arrow of arrows) {
      expect(arrow.hasAttribute('data-magnetic')).toBe(true);
      expect(arrow.querySelector('app-pixel-arrow')).not.toBeNull();
    }
  });
});
