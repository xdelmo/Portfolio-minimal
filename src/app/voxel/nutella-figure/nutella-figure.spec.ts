import { TestBed } from '@angular/core/testing';
import { NutellaFigure } from './nutella-figure';

describe('NutellaFigure', () => {
  afterEach(() => vi.unstubAllGlobals());

  function prefersReducedMotion(reduce: boolean): void {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: reduce && query.includes('reduce'), addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  }

  it('shows the still render with reduced motion and never loads the scene', async () => {
    prefersReducedMotion(true);
    const fixture = TestBed.createComponent(NutellaFigure);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('img.still')?.getAttribute('alt')).toBe('');
    expect(el.querySelector('app-nutella-scene')).toBeNull();
  });

  it('reserves the square space of the image', async () => {
    prefersReducedMotion(true);
    const fixture = TestBed.createComponent(NutellaFigure);
    await fixture.whenStable();
    const img = (fixture.nativeElement as HTMLElement).querySelector('img.still');
    expect(img?.getAttribute('width')).toBe('256');
    expect(img?.getAttribute('height')).toBe('256');
  });

  it('exposes the mood input on the host element', async () => {
    prefersReducedMotion(true);
    const fixture = TestBed.createComponent(NutellaFigure);
    fixture.componentRef.setInput('mood', 'curious');
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).getAttribute('data-mood')).toBe('curious');
  });
});
