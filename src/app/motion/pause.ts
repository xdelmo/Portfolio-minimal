import { Injectable, signal } from '@angular/core';

const KEY = 'motion-paused';
const ATTR = 'data-motion-paused';
const EVENT = 'motion:pause';

function read(): boolean {
  try {
    return typeof sessionStorage !== 'undefined' && sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

/** One switch for all automatic motion (WCAG 2.2.2): the pixel field, the moai and the GSAP effects follow it. */
@Injectable({ providedIn: 'root' })
export class MotionPause {
  readonly paused = signal(read());

  constructor() {
    this.publish();
  }

  toggle(): void {
    this.paused.update((paused) => !paused);
    try {
      sessionStorage.setItem(KEY, this.paused() ? '1' : '0');
    } catch {
      // storage blocked: the choice lasts until the page is closed
    }
    this.publish();
  }

  /** GSAP effects live outside Angular's injector: they read the state from <html> (see watchPause). */
  private publish(): void {
    if (typeof document === 'undefined') return;
    document.documentElement.toggleAttribute(ATTR, this.paused());
    document.dispatchEvent(new Event(EVENT));
  }
}

/** Calls `onChange` now and whenever the pause button is pressed; returns the function that stops listening. */
export function watchPause(onChange: (paused: boolean) => void): () => void {
  const notify = (): void => {
    onChange(document.documentElement.hasAttribute(ATTR));
  };
  notify();
  document.addEventListener(EVENT, notify);
  return () => {
    document.removeEventListener(EVENT, notify);
  };
}
