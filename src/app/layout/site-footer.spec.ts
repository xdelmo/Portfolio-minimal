import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CONTENT } from '../content/content';
import { CONTENT_EN } from '../content/content.en';
import { APP_VERSION } from '../core/version.generated';
import { SiteFooter } from './site-footer';

describe('SiteFooter', () => {
  it('renders copyright with year, name and release version', async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: CONTENT, useValue: CONTENT_EN }],
    });
    const fixture = TestBed.createComponent(SiteFooter);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const p = el.querySelector('footer p');
    expect(p?.textContent).toContain(`© ${String(new Date().getFullYear())} ${CONTENT_EN.person.name} · v${APP_VERSION}`);
  });
});
