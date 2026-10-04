import { Injectable, signal } from '@angular/core';

const KEY = 'motion-paused';

function read(): boolean {
  try {
    return typeof sessionStorage !== 'undefined' && sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

/** One switch for all automatic motion (WCAG 2.2.2): the pixel field, the moai and the ambient orbs follow it. */
@Injectable({ providedIn: 'root' })
export class MotionPause {
  readonly paused = signal(read());

  toggle(): void {
    this.paused.update((paused) => !paused);
    try {
      sessionStorage.setItem(KEY, this.paused() ? '1' : '0');
    } catch {
      // storage blocked: the choice lasts until the page is closed
    }
  }
}
