import { DestroyRef, Directive, ElementRef, InjectionToken, afterNextRender, inject, input, signal } from '@angular/core';
import type { ScrollTrigger as ScrollTriggerType } from 'gsap/ScrollTrigger';
import type { SplitText as SplitTextType } from 'gsap/SplitText';

export interface MotionLib {
  gsap: typeof gsap;
  ScrollTrigger: typeof ScrollTriggerType;
  SplitText: typeof SplitTextType;
}

export interface Motion extends MotionLib {
  /** wide screen with a mouse: pins and hover effects run only here */
  desktop: boolean;
}

/**
 * One motion effect. It creates its tweens synchronously, so the surrounding GSAP context can revert them;
 * anything GSAP cannot undo (event listeners) goes in the cleanup it returns.
 */
export type Effect = (root: HTMLElement, motion: Motion) => (() => void) | undefined;

/**
 * Resolves after the next frame has been painted: a frame callback runs just before a paint, a task queued from it
 * just after. On a fast device hydration ends before the first paint, and fetching GSAP then would put its 50 KB
 * on the headline's critical path (Lighthouse LCP).
 */
export function afterPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      setTimeout(resolve);
    });
  });
}

function nextTask(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve);
  });
}

export const MOTION_LOADER =new InjectionToken<() => Promise<MotionLib>>('MOTION_LOADER', {
  providedIn: 'root',
  factory: () => () => afterPaint().then(async () => (await import('./gsap')).loadGsap()),
});

const CONDITIONS = {
  motion: '(prefers-reduced-motion: no-preference)',
  desktop: '(min-width: 1024px) and (hover: hover)',
};

/** Runs motion effects on its element after hydration; reduced motion or a failed download leaves the static page. */
@Directive({
  selector: '[appMotion]',
  host: { '[attr.data-motion]': 'state()' },
})
export class MotionHost {
  readonly appMotion = input.required<readonly Effect[]>();
  protected readonly state = signal<'pending' | 'ready' | 'off'>('pending');

  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const load = inject(MOTION_LOADER);
    let revert: (() => void) | undefined;
    let destroyed = false;
    // read through a function: after an await, TypeScript still narrows the flag to its first value
    const isDestroyed = (): boolean => destroyed;
    inject(DestroyRef).onDestroy(() => {
      destroyed = true;
      revert?.();
    });

    afterNextRender(() => {
      if (typeof matchMedia !== 'function' || matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.state.set('off');
        return;
      }
      load()
        .then(async (lib) => {
          if (destroyed) return;
          const mm = lib.gsap.matchMedia();
          revert = () => {
            mm.revert();
          };
          // matchMedia re-runs (and reverts) an effect when a condition flips, e.g. resizing across 1024px.
          // One task per effect, in page order: all at once they held the main thread for one long task at load
          // (Lighthouse's Total Blocking Time on the home).
          for (const effect of this.appMotion()) {
            await nextTask();
            if (isDestroyed()) return;
            mm.add(CONDITIONS, (ctx) => {
              const conditions = ctx.conditions ?? {};
              if (!conditions['motion']) return;
              try {
                return effect(el, { ...lib, desktop: conditions['desktop'] });
              } catch (error) {
                console.warn('motion effect failed', error);
                return undefined;
              }
            });
          }
          this.state.set('ready');
        })
        .catch(() => {
          this.state.set('off');
        });
    });
  }
}
