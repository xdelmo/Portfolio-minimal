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

/** One motion effect. It creates its tweens synchronously, so the surrounding GSAP context can revert them. */
export type Effect = (root: HTMLElement, motion: Motion) => void;

export const MOTION_LOADER = new InjectionToken<() => Promise<MotionLib>>('MOTION_LOADER', {
  providedIn: 'root',
  factory: () => () => import('./gsap'),
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
        .then((lib) => {
          if (destroyed) return;
          const mm = lib.gsap.matchMedia();
          revert = () => {
            mm.revert();
          };
          // matchMedia re-runs (and reverts) the effects when a condition flips, e.g. resizing across 1024px
          mm.add(CONDITIONS, (ctx) => {
            const conditions = ctx.conditions ?? {};
            if (!conditions['motion']) return;
            for (const effect of this.appMotion()) {
              try {
                effect(el, { ...lib, desktop: conditions['desktop'] });
              } catch (error) {
                console.warn('motion effect failed', error);
              }
            }
          });
          this.state.set('ready');
        })
        .catch(() => {
          this.state.set('off');
        });
    });
  }
}
