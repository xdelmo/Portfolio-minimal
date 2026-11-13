import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Music } from '../music/music';

/** Turns the chiptune background music on and off (issue #516); off by default. */
@Component({
  selector: 'app-music-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="music-toggle"
      (click)="music.toggle()"
      [attr.aria-pressed]="music.on()"
      i18n-aria-label="@@music.toggle"
      aria-label="Background music"
    >
      <svg viewBox="0 0 8 8" width="16" height="16" shape-rendering="crispEdges" aria-hidden="true">
        <path fill="currentColor" d="M1 3h2v2H1zM3 2h1v4H3zM4 1h1v6H4z" />
        @if (music.on()) {
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
  protected readonly music = inject(Music);
}
