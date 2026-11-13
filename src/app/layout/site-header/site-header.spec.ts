import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { testProviders } from '../../../testing/test-providers';
import { CONTENT_EN } from '../../content/content.en';
import { SiteHeader } from './site-header';

describe('SiteHeader', () => {
  it('renders the contact call to action pointing to LinkedIn (#472)', async () => {
    TestBed.configureTestingModule({
      providers: [...testProviders(), provideRouter([])],
    });
    const fixture = TestBed.createComponent(SiteHeader);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const cta = el.querySelector('.site-header > .cta');
    expect(cta?.getAttribute('href')).toBe(CONTENT_EN.person.linkedin);
    expect(cta?.getAttribute('target')).toBe('_blank');
    expect(cta?.getAttribute('rel')).toBe('me noopener');
    expect(cta?.getAttribute('aria-describedby')).toBe('new-tab');
  });
});
