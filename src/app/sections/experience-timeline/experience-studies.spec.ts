import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CONTENT_EN } from '../../content/content.en';
import { ExperienceStudies } from './experience-studies';

describe('ExperienceStudies', () => {
  const render = async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(ExperienceStudies);
    fixture.componentRef.setInput('studies', CONTENT_EN.studies);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  };

  it('lists the degree, with its case study, and the certificates', async () => {
    const el = await render();
    const rows = [...el.querySelectorAll('li')].map((li) => li.textContent);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toContain('Computer Engineering');
    expect(el.querySelector('a[href$="work/apexflow"]')).not.toBeNull();
  });

  it('shows each one as an unlocked achievement: its pixel item, then where and when on one line', async () => {
    const el = await render();
    const items = [...el.querySelectorAll('li')];
    expect(items.map((li) => li.querySelector('app-quest-sprite')?.getAttribute('data-sprite'))).toEqual(['cap', 'trophy', 'terminal']);
    expect(items[0].querySelector('.meta')?.textContent.trim()).toBe('Università Mercatorum, 2026');
    // the year lives in that line, not in a column of its own
    expect(el.querySelector('.period')).toBeNull();
  });
});
