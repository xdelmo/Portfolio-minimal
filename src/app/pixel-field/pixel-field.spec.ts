import { ErrorHandler } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PixelField } from './pixel-field';
import { endIntro } from '../motion/intro-state';

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

  it('stays quiet and offers no pause button without a canvas context', async () => {
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

  async function renderUnderIntro() {
    const ctx = new Proxy({}, { get: () => () => undefined }) as CanvasRenderingContext2D;
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(((id: string) => (id === '2d' ? ctx : null)) as never);
    const Observer = class {
      observe = () => undefined;
      disconnect = () => undefined;
    };
    vi.stubGlobal('ResizeObserver', Observer);
    vi.stubGlobal('IntersectionObserver', Observer);
    vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: () => undefined, removeEventListener: () => undefined }));
    vi.stubGlobal('requestAnimationFrame', () => 1);
    document.documentElement.classList.add('intro-on');
    const fixture = TestBed.createComponent(PixelField);
    await fixture.whenStable();
    const field = fixture.componentInstance as unknown as { frame: { t: number }; last: number; tick: (now: number) => void };
    // performance.now() has a fraction, and (last + 50) - last is not always 50 in floating point (issue #380)
    field.last = 0;
    const frames = () => {
      for (let i = 1; i <= 3; i++) field.tick(field.last + 50);
      return field.frame.t;
    };
    return { fixture, frames };
  }

  afterEach(() => {
    document.documentElement.classList.remove('intro-on');
    vi.unstubAllGlobals();
  });

  // the cloud stays empty under the panel and composes once, with the headline (issues #369, #374)
  it('holds the cloud empty under the intro and composes it once the intro has gone', async () => {
    const { fixture, frames } = await renderUnderIntro();
    expect(frames()).toBe(0);
    endIntro();
    expect(frames()).toBe(150);
    fixture.destroy();
  });

  it('composes it when the CSS fallback lifts the panel, without the motion script', async () => {
    const { fixture, frames } = await renderUnderIntro();
    const panel = document.body.appendChild(document.createElement('div'));
    panel.className = 'site-intro';
    panel.dispatchEvent(new Event('animationend', { bubbles: true }));
    expect(frames()).toBe(150);
    panel.remove();
    fixture.destroy();
  });

  it('can be destroyed where requestAnimationFrame does not exist, as on the server', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const fixture = TestBed.createComponent(PixelField);
    await fixture.whenStable();
    vi.stubGlobal('cancelAnimationFrame', undefined);
    expect(() => {
      fixture.destroy();
    }).not.toThrow();
    vi.unstubAllGlobals();
  });
});
