import { Injectable, signal } from '@angular/core';

/**
 * Background music (issue #516): off on every page load, started only by the visitor. The player and the song are a
 * lazy chunk loaded on the first press. The choice lasts across in-app navigation, not across reloads: a browser
 * would not let it start again without a new press anyway.
 */
@Injectable({ providedIn: 'root' })
export class Music {
  readonly on = signal(false);
  private ctx?: AudioContext;
  private stop?: () => void;

  toggle(): void {
    if (this.on()) {
      this.on.set(false);
      this.stop?.();
      this.stop = undefined;
      return;
    }
    this.on.set(true);
    // created and resumed inside the press itself: browsers (Safari above all) only let a gesture start audio
    this.ctx ??= new AudioContext();
    const ctx = this.ctx;
    void ctx.resume();
    import('./play')
      .then(({ play }) => {
        if (this.on() && !this.stop) this.stop = play(ctx);
      })
      .catch(() => {
        this.on.set(false);
      });
  }
}
