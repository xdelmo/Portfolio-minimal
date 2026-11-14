import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { firstValueFrom, of } from 'rxjs';
import { IdlePreload } from './idle-preload';

describe('IdlePreload (#322)', () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it('loads the page once the browser is idle', async () => {
    vi.stubGlobal('requestIdleCallback', (callback: () => void) => { callback(); });
    const load = vi.fn(() => of('chunk'));
    expect(await firstValueFrom(TestBed.inject(IdlePreload).preload({}, load))).toBe('chunk');
    expect(load).toHaveBeenCalledOnce();
  });

  it('loads nothing on the server', async () => {
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });
    const load = vi.fn(() => of('chunk'));
    expect(await firstValueFrom(TestBed.inject(IdlePreload).preload({}, load))).toBeNull();
    expect(load).not.toHaveBeenCalled();
  });
});
