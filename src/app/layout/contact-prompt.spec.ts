import { TestBed } from '@angular/core/testing';
import { testProviders } from '../../testing/test-providers';
import { CONTENT_EN } from '../content/content.en';
import { ContactPrompt } from './contact-prompt';

describe('ContactPrompt', () => {
  it('renders the hiring lead and links to LinkedIn (#472)', async () => {
    TestBed.configureTestingModule({
      providers: testProviders(),
    });
    const fixture = TestBed.createComponent(ContactPrompt);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const lead = el.querySelector('.lead');
    expect(lead?.textContent).toContain('Hiring for a frontend role?');

    const link = el.querySelector('a.button--primary');
    expect(link?.getAttribute('href')).toBe(CONTENT_EN.person.linkedin);
    expect(link?.getAttribute('target')).toBe('_blank');
    expect(link?.getAttribute('rel')).toBe('me noopener');
    expect(link?.getAttribute('aria-describedby')).toBe('new-tab');
  });
});
