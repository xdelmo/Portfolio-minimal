import { TestBed } from '@angular/core/testing';
import { testProviders } from '../testing/test-providers';
import { App } from './app';

describe('App', () => {
  it('renders header, main landmark and footer', async () => {
    TestBed.configureTestingModule({ providers: testProviders() });
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('header')).not.toBeNull();
    expect(el.querySelector('main#main')).not.toBeNull();
    expect(el.querySelector('footer')).not.toBeNull();
  });
});
