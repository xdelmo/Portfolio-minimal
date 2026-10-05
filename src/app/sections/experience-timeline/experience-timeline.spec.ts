import { TestBed } from '@angular/core/testing';
import { CONTENT_EN } from '../../content/content.en';
import { ExperienceTimeline } from './experience-timeline';

describe('ExperienceTimeline', () => {
  it('renders an ordered list, newest first, with the period before the title', async () => {
    const fixture = TestBed.createComponent(ExperienceTimeline);
    fixture.componentRef.setInput('items', CONTENT_EN.experience);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const items = [...el.querySelectorAll('ol > li')];
    expect(items).toHaveLength(CONTENT_EN.experience.length);
    expect(items[0].querySelector('.period')?.textContent.trim()).toBe('2026 – present');
    const text = items[0].textContent;
    expect(text.indexOf('2026 – present')).toBeLessThan(text.indexOf('Software Engineer'));
  });

  it('can be destroyed where window listeners do not exist, as during prerendering', () => {
    const fixture = TestBed.createComponent(ExperienceTimeline);
    fixture.componentRef.setInput('items', CONTENT_EN.experience);
    // like the server: built and destroyed without a browser render, so afterNextRender never runs
    vi.stubGlobal('removeEventListener', undefined);
    expect(() => {
      fixture.destroy();
    }).not.toThrow();
    vi.unstubAllGlobals();
  });
});
