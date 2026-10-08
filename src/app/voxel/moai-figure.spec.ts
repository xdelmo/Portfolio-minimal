import { TestBed } from '@angular/core/testing';
import { MoaiFigure } from './moai-figure';

describe('MoaiFigure', () => {
  afterEach(() => vi.unstubAllGlobals());

  function prefersReducedMotion(reduce: boolean): void {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: reduce && query.includes('reduce'), addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  }

  it('shows the still moai with reduced motion and never loads the scene', async () => {
    prefersReducedMotion(true);
    const fixture = TestBed.createComponent(MoaiFigure);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('img.still')?.getAttribute('alt')).toBe('');
    expect(el.querySelector('app-moai-scene')).toBeNull();
  });

  it('stays on the still image where matchMedia is missing', async () => {
    vi.stubGlobal('matchMedia', undefined);
    const fixture = TestBed.createComponent(MoaiFigure);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('img.still')).not.toBeNull();
  });

  it('reserves the space of the image before anything loads', async () => {
    prefersReducedMotion(true);
    const fixture = TestBed.createComponent(MoaiFigure);
    await fixture.whenStable();
    const img = (fixture.nativeElement as HTMLElement).querySelector('img.still');
    expect(img?.getAttribute('width')).toBe('288');
    expect(img?.getAttribute('height')).toBe('655');
  });
});
