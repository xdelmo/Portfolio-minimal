import { ErrorHandler } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PixelField } from './pixel-field';

describe('PixelField', () => {
  afterEach(() => vi.restoreAllMocks());

  async function render() {
    const handleError = vi.fn();
    TestBed.configureTestingModule({ providers: [{ provide: ErrorHandler, useValue: { handleError } }] });
    const fixture = TestBed.createComponent(PixelField);
    await fixture.whenStable();
    return { el: fixture.nativeElement as HTMLElement, handleError };
  }

  it('renders a decorative canvas', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const { el } = await render();
    expect(el.querySelector('canvas')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('stays quiet and offers no pause button without a 2D canvas', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const { el, handleError } = await render();
    expect(el.querySelector('button')).toBeNull();
    expect(handleError).not.toHaveBeenCalled();
  });

  it('reports a failure while starting and leaves no pause button behind', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({} as CanvasRenderingContext2D);
    vi.stubGlobal('ResizeObserver', undefined);
    const { el, handleError } = await render();
    expect(handleError).toHaveBeenCalledOnce();
    expect(el.querySelector('button')).toBeNull();
    vi.unstubAllGlobals();
  });
});
