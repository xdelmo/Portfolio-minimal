import { currentSmoother, scrollToTop, setSmoother } from './smoother';

describe('scrollToTop (issue #609)', () => {
  const before = currentSmoother;
  afterEach(() => {
    if (before) setSmoother(before);
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('goes through ScrollSmoother when it runs, never the native smooth scroll', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    const scrollTo = vi.fn();
    setSmoother({ scrollTo } as unknown as Parameters<typeof setSmoother>[0]);
    const native = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    scrollToTop();
    expect(scrollTo).toHaveBeenCalledWith(0, true);
    expect(native).not.toHaveBeenCalled();
  });
});
