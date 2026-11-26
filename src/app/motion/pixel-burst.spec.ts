import { burstPixels } from './pixel-burst';

describe('burstPixels', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  function setupButton() {
    const host = document.createElement('div');
    const button = document.createElement('button');
    host.append(button);
    document.body.append(host);
    return { host, button };
  }

  it('spawns six pastel pixel spans and removes them after the burst', () => {
    vi.useFakeTimers();
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('no-preference') }));
    const { host, button } = setupButton();

    burstPixels(button);
    const pixels = [...host.querySelectorAll<HTMLElement>('.pixel-burst')];
    expect(pixels).toHaveLength(6);
    expect(pixels.map((p) => p.style.background)).toEqual([
      'var(--px-1)',
      'var(--px-2)',
      'var(--px-3)',
      'var(--px-4)',
      'var(--px-5)',
      'var(--px-6)',
    ]);

    vi.advanceTimersByTime(300);
    expect(host.querySelectorAll('.pixel-burst')).toHaveLength(0);
  });

  it('spawns nothing when reduced motion is preferred', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    const { host, button } = setupButton();
    burstPixels(button);
    expect(host.querySelectorAll('.pixel-burst')).toHaveLength(0);
  });

  it('spawns nothing under forced colours', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('no-preference') || q.includes('forced-colors') }));
    const { host, button } = setupButton();
    burstPixels(button);
    expect(host.querySelectorAll('.pixel-burst')).toHaveLength(0);
  });
});
