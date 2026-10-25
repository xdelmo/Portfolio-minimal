import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { type Effect, MOTION_LOADER, MotionHost, type MotionLib, afterPaint } from './motion-host';

@Component({
  imports: [MotionHost],
  template: `@if (shown()) {<div [appMotion]="effects"></div>}`,
})
class Host {
  readonly shown = signal(true);
  effects: readonly Effect[] = [];
}

function fakeLib(revert: () => void): MotionLib {
  const gsap = {
    matchMedia: () => ({
      add: (_conditions: unknown, run: (ctx: { conditions: Record<string, boolean> }) => void) => {
        run({ conditions: { motion: true, desktop: false } });
      },
      revert,
    }),
  };
  return { gsap, ScrollTrigger: {}, SplitText: {} } as unknown as MotionLib;
}

async function render(effects: readonly Effect[], reduce: boolean, revert = vi.fn()) {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: reduce && query.includes('reduce'), addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  TestBed.configureTestingModule({ providers: [{ provide: MOTION_LOADER, useValue: () => Promise.resolve(fakeLib(revert)) }] });
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.effects = effects;
  await fixture.whenStable();
  await Promise.resolve();
  await fixture.whenStable();
  const el = (fixture.nativeElement as HTMLElement).querySelector('div') as HTMLElement;
  // the effects start one task at a time: wait until the last one has
  await vi.waitFor(() => {
    fixture.detectChanges();
    expect(el.dataset['motion']).not.toBe('pending');
  });
  return { fixture, el, revert };
}

describe('MotionHost', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('runs nothing and marks itself off with reduced motion', async () => {
    const effect = vi.fn();
    const { el } = await render([effect], true);
    expect(effect).not.toHaveBeenCalled();
    expect(el.dataset['motion']).toBe('off');
  });

  it('keeps running the other effects when one throws', async () => {
    const broken: Effect = () => {
      throw new Error('boom');
    };
    const working = vi.fn();
    const { el } = await render([broken, working], false);
    expect(working).toHaveBeenCalledTimes(1);
    expect(working.mock.calls[0][0]).toBe(el);
    expect(el.dataset['motion']).toBe('ready');
  });

  it('starts each effect in its own task, in page order (one long task at load cost the home its Lighthouse score)', async () => {
    const order: string[] = [];
    const first: Effect = () => {
      order.push('first');
      queueMicrotask(() => order.push('same task'));
      setTimeout(() => order.push('next task'));
      return undefined;
    };
    const second: Effect = () => {
      order.push('second');
      return undefined;
    };
    await render([first, second], false);
    expect(order).toEqual(['first', 'same task', 'next task', 'second']);
  });

  it('reverts every animation when destroyed', async () => {
    const { fixture, revert } = await render([vi.fn()], false);
    fixture.componentInstance.shown.set(false);
    await fixture.whenStable();
    expect(revert).toHaveBeenCalled();
  });
});

describe('afterPaint', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('resolves only after a frame and the task that follows its paint', async () => {
    let frame: FrameRequestCallback | undefined;
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frame = callback;
      return 1;
    });
    const done = vi.fn();
    void afterPaint().then(done);
    await new Promise((resolve) => setTimeout(resolve));
    expect(done).not.toHaveBeenCalled();
    frame?.(0);
    await Promise.resolve();
    expect(done).not.toHaveBeenCalled();
    await new Promise((resolve) => setTimeout(resolve));
    expect(done).toHaveBeenCalledTimes(1);
  });
});
