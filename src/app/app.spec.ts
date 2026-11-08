import { CONTENT } from './content/content';
import { CONTENT_EN } from './content/content.en';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  it('renders header, main landmark and footer', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: CONTENT, useValue: CONTENT_EN }] });
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('header')).not.toBeNull();
    expect(el.querySelector('main#main')).not.toBeNull();
    expect(el.querySelector('footer')).not.toBeNull();
  });
});
