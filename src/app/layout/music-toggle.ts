import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

/*
 * Background music (issue #516): off on every page load, started only by the visitor. The player and the song are a
 * lazy chunk loaded on the first press. The state is shared by the header's and the menu's buttons and lasts across
 * in-app navigation, not across reloads: a browser would not let it start again without a new press anyway.
 */
const on = signal(false);
let ctx: AudioContext | undefined;
let stop: (() => void) | undefined;

function toggle(): void {
  if (on()) {
    on.set(false);
    stop?.();
    stop = undefined;
    // once the fade is over, let the audio device sleep, unless the visitor turned it back on meanwhile
    setTimeout(() => {
      if (!on()) void ctx?.suspend();
    }, 450);
    return;
  }
  on.set(true);
  // created and resumed inside the press itself: browsers (Safari above all) only let a gesture start audio
  const context = (ctx ??= new AudioContext());
  void context.resume();
  import('../music/play')
    .then(({ play }) => {
      if (on() && !stop) stop = play(context);
    })
    .catch(() => {
      on.set(false);
    });
}

/** Turns the 8-bit ambient background music on and off; off by default. */
@Component({
  selector: 'app-music-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="music-toggle"
      (click)="toggle()"
      [attr.aria-pressed]="on()"
      i18n-aria-label="@@music.toggle"
      aria-label="Background music"
    >
      <svg viewBox="0 0 8 8" width="16" height="16" shape-rendering="crispEdges" aria-hidden="true">
        <path fill="currentColor" d="M1 3h2v2H1zM3 2h1v4H3zM4 1h1v6H4z" />
        @if (on()) {
          <path fill="currentColor" d="M6 3h1v2H6zM7 1h1v6H7z" />
        } @else {
          <path fill="currentColor" d="M5 2.5h1v1H5zM7 2.5h1v1H7zM6 3.5h1v1H6zM5 4.5h1v1H5zM7 4.5h1v1H7z" />
        }
      </svg>
    </button>
  `,
  styles: `
    .music-toggle {
      display: grid;
      place-items: center;
      width: 48px;
      height: 48px;
      padding: 0;
      border: 0;
      background: transparent;
      color: var(--fg);
      cursor: pointer;
    }
  `,
})
export class MusicToggle {
  protected readonly on = on;
  protected readonly toggle = toggle;
}
