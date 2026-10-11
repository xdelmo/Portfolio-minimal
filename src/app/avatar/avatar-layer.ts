import { ChangeDetectionStrategy, Component, DestroyRef, afterNextRender, inject, signal } from '@angular/core';
import { AvatarScene } from './avatar-scene';

/** What wakes the 3D avatar: the first sign of a visitor. */
const WAKE_EVENTS = ['scroll', 'pointermove', 'pointerdown', 'touchstart', 'keydown'] as const;
/** Or this long after the page is ready, for a visitor who only looks. */
const WAKE_MS = 5000;
/** sessionStorage key: 'still' keeps the still image (the e2e set it, the avatar's own tests remove it; issue #184). */
const AVATAR_STILL_KEY = 'avatar';

/**
 * One layer over the home page that motion/effects/walker.ts moves from the hero down the pixel thread; the 3D avatar
 * draws inside it. Hidden until it is both placed by the effect and drawn by the scene.
 */
function stillOnly(): boolean {
  try {
    return sessionStorage.getItem(AVATAR_STILL_KEY) === 'still';
  } catch {
    return false;
  }
}

@Component({
  selector: 'app-avatar-layer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AvatarScene],
  host: { class: 'avatar' },
  template: `
    @if (live()) {
      @defer {
        <app-avatar-scene />
      }
    }
  `,
  styles: `
    // above the bands and the thread, in the coordinates of the page it lies on
    :host {
      position: absolute;
      top: 0;
      left: 0;
      z-index: 3;
      translate: var(--avatar-x, 0) var(--avatar-y, 0);
      scale: var(--avatar-scale, 1);
      transform-origin: 0 0;
      visibility: hidden;
      // until walker.ts sizes it: without a size the canvas would take its height from its own pixel buffer, and the
      // scene's ResizeObserver resizing that buffer looped (WebKit reports it as an error)
      width: 0;
      height: 0;
    }
    :host([data-place][data-drawn]) {
      visibility: visible;
    }
  `,
})
export class AvatarLayer {
  /**
   * Three.js waits for the visitor, not just for an idle moment: fetched right after hydration it was on Lighthouse's
   * critical path and cost the home 0.98 → 0.92. The still image has the 3D avatar's first pose, so the swap is invisible.
   * No 3D avatar with reduced motion: the still image stays, and Three.js is never downloaded for it.
   */
  protected readonly live = signal(false);

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches || stillOnly()) return;
      const stop = (): void => {
        clearTimeout(timer);
        for (const type of WAKE_EVENTS) removeEventListener(type, wake);
      };
      const wake = (): void => {
        stop();
        this.live.set(true);
      };
      const timer = setTimeout(wake, WAKE_MS);
      for (const type of WAKE_EVENTS) addEventListener(type, wake, { passive: true });
      destroyRef.onDestroy(stop);
    });
  }
}
