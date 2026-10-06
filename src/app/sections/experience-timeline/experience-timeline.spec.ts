import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CONTENT_EN } from '../../content/content.en';
import { ExperienceTimeline } from './experience-timeline';

describe('ExperienceTimeline', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  it('renders an ordered list, oldest first so the deck ends on the current job, period before title', async () => {
    const fixture = TestBed.createComponent(ExperienceTimeline);
    fixture.componentRef.setInput('items', CONTENT_EN.experience);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const items = [...el.querySelectorAll('ol.timeline > li')];
    expect(items).toHaveLength(CONTENT_EN.experience.length);
    const current = items[items.length - 1];
    expect(current.querySelector('.period')?.textContent.trim()).toBe('2026 – present');
    const text = current.textContent;
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

  it('gives every job its highlights, its tools and, where there is one, the case study', async () => {
    const fixture = TestBed.createComponent(ExperienceTimeline);
    fixture.componentRef.setInput('items', CONTENT_EN.experience);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const cards = [...el.querySelectorAll<HTMLElement>('ol.timeline > li')];
    expect(cards).toHaveLength(3);
    cards.forEach((card, i) => {
      expect(card.id).toBe(`exp-${String(i)}`);
      expect(card.querySelectorAll('.highlights li').length).toBeGreaterThan(0);
      expect(card.querySelectorAll('.tags li').length).toBeGreaterThan(0);
    });
    expect(el.querySelector<HTMLAnchorElement>('ol.timeline a[href$="work/apexflow"]')).not.toBeNull();
  });

  it('keeps studies and certificates out of the deck', async () => {
    const fixture = TestBed.createComponent(ExperienceTimeline);
    fixture.componentRef.setInput('items', CONTENT_EN.experience);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Agile Masterclass');
  });

  it('opens with a chapter track: one link per job, to its card, named in full', async () => {
    const fixture = TestBed.createComponent(ExperienceTimeline);
    fixture.componentRef.setInput('items', CONTENT_EN.experience);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const links = [...el.querySelectorAll<HTMLAnchorElement>('nav.chapters a')];
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['#exp-0', '#exp-1', '#exp-2']);
    expect(links[2].textContent.replace(/\s+/g, ' ').trim()).toBe('2026 – present Frontend Specialist, IPS S.p.A.');
  });
});
