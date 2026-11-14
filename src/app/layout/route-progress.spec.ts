import { TestBed } from '@angular/core/testing';
import { NavigationCancel, NavigationCancellationCode, NavigationEnd, NavigationStart, Router, type Event } from '@angular/router';
import { Subject } from 'rxjs';
import { RouteProgress } from './route-progress';

describe('RouteProgress (#322)', () => {
  function setup() {
    const events = new Subject<Event>();
    TestBed.configureTestingModule({ providers: [{ provide: Router, useValue: { events } }] });
    const fixture = TestBed.createComponent(RouteProgress);
    const bar = async () => {
      await fixture.whenStable();
      return (fixture.nativeElement as HTMLElement).querySelector('[role="progressbar"]');
    };
    return { events, bar };
  }

  it('shows while another page loads and goes when it arrives', async () => {
    const { events, bar } = setup();
    events.next(new NavigationStart(2, '/blog'));
    expect(await bar()).not.toBeNull();
    events.next(new NavigationEnd(2, '/blog', '/blog'));
    expect(await bar()).toBeNull();
  });

  it('goes when the page change is cancelled', async () => {
    const { events, bar } = setup();
    events.next(new NavigationStart(2, '/blog'));
    events.next(new NavigationCancel(2, '/blog', '', NavigationCancellationCode.SupersededByNewNavigation));
    expect(await bar()).toBeNull();
  });

  it('stays hidden on the first navigation, at hydration', async () => {
    const { events, bar } = setup();
    events.next(new NavigationStart(1, '/'));
    expect(await bar()).toBeNull();
  });
});
