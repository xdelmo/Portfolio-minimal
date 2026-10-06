import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CONTENT_EN } from '../../content/content.en';
import { ExperienceStudies } from './experience-studies';

describe('ExperienceStudies', () => {
  it('lists the degree, with its case study, and the certificate', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(ExperienceStudies);
    fixture.componentRef.setInput('studies', CONTENT_EN.studies);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const rows = [...el.querySelectorAll('li')].map((li) => li.textContent);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toContain('Computer Engineering');
    expect(el.querySelector('a[href$="work/apexflow"]')).not.toBeNull();
  });
});
