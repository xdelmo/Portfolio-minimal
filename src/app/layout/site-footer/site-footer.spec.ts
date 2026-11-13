import { type WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { testProviders } from '../../../testing/test-providers';
import { CONTENT_EN } from '../../content/content.en';
import { APP_VERSION } from '../../core/version.generated';
import { SiteFooter } from './site-footer';

describe('SiteFooter', () => {
  it('renders copyright with year, name and release version', async () => {
    TestBed.configureTestingModule({
      providers: testProviders(),
    });
    const fixture = TestBed.createComponent(SiteFooter);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const p = el.querySelector('footer p');
    expect(p?.textContent).toContain(`© ${String(new Date().getFullYear())} ${CONTENT_EN.person.name} · v${APP_VERSION}`);
  });

  it('renders press-start button without text label when ready', async () => {
    TestBed.configureTestingModule({
      providers: testProviders(),
    });
    const fixture = TestBed.createComponent(SiteFooter);
    const footer = fixture.componentInstance as unknown as { ready: WritableSignal<boolean> };
    footer.ready.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const button = el.querySelector<HTMLButtonElement>('button[data-press-start]');
    expect(button).not.toBeNull();
    if (!button) throw new Error('missing button');
    expect(button.getAttribute('aria-label')).toBe('Press start');
    expect(button.querySelector('svg.key')).not.toBeNull();
    expect(button.textContent.trim()).toBe('');
  });
});
