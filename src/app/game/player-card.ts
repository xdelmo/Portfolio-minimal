import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input, output, viewChild } from '@angular/core';
import { CONTENT } from '../content/content';
import { QuestSprite } from '../sections/side-quests/quest-sprite';

/**
 * The easter egg behind the Konami code (issue #2): Emanuele as a game character, with a level, a class, the
 * experience points towards the next role and four achievements that the rest of the site does not mention. A native modal dialog: Escape and the button close
 * it, and the browser gives focus back to where it was. Loaded only when the code is entered (game-trigger.ts).
 */
@Component({
  selector: 'app-player-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [QuestSprite],
  template: `
    <dialog #dialog class="card band--ink" aria-labelledby="game-title" (close)="done.emit()">
      @if (cheat()) {
        <h2 id="game-title" i18n="@@game.cheat">Cheat activated</h2>
      } @else {
        <!-- the pause screen of a retro role-playing game (issue #111) -->
        <h2 id="game-title" i18n="@@game.title">Pause</h2>
      }
      <dl class="stats">
        <div>
          <dt i18n="@@game.player">Player</dt>
          <dd>{{ content.game.player }}</dd>
        </div>
        <div>
          <dt i18n="@@game.class">Class</dt>
          <dd>{{ content.person.role }}</dd>
        </div>
        <div>
          <dt i18n="@@game.level">Level</dt>
          <dd>{{ cheat() ? 99 : content.game.level }}</dd>
        </div>
      </dl>
      <p class="xp">
        <label for="game-xp" i18n="@@game.xp">Experience points to {{ content.game.next }}</label>
        <meter id="game-xp" min="0" max="1" [value]="xp()">{{ xp() * 100 }}%</meter>
      </p>
      <h3 i18n="@@game.achievements">Achievements</h3>
      <ul class="achievements">
        @for (achievement of content.game.achievements; track achievement.title) {
          <li>
            <app-quest-sprite class="sprite" [name]="achievement.sprite" />
            <span><strong>{{ achievement.title }}</strong> {{ achievement.detail }}</span>
          </li>
        }
        @if (cheat()) {
          <li class="unlocked">
            <app-quest-sprite class="sprite" [name]="content.game.cheat.sprite" />
            <span><strong>{{ content.game.cheat.title }}</strong> {{ content.game.cheat.detail }}</span>
          </li>
        }
      </ul>
      <form method="dialog">
        <button class="button button--primary" i18n="@@game.continue">Continue</button>
      </form>
    </dialog>
  `,
  styles: `
    .card {
      width: min(100% - 2 * var(--gutter), 32rem);
      max-height: calc(100svh - 2 * var(--space-2));
      padding: var(--space-4);
      border: 4px solid var(--fg);
      outline: 4px solid var(--band-ink-bg);
      background: var(--band-ink-bg);
      color: var(--fg);
      overflow: auto;
    }
    .card::backdrop {
      background: rgb(0 0 0 / 0.6);
    }
    .card > * + * {
      margin-top: var(--space-3);
    }
    h2 {
      font-size: var(--step-5);
      font-variation-settings: 'wdth' 75;
      line-height: 1;
    }
    h3 {
      font-size: var(--step-1);
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(3, auto);
      justify-content: start;
      gap: var(--space-3);
      margin: 0;
    }
    dt {
      color: var(--fg-muted);
      font-size: var(--step--1);
    }
    dd {
      margin: 0;
      font-weight: 600;
    }
    .xp {
      display: grid;
      gap: var(--space-1);
    }
    label {
      color: var(--fg-muted);
      font-size: var(--step--1);
    }
    // the bar drawn as the site draws everything: hard edges, accent on ink
    meter {
      width: 100%;
      height: var(--space-2);
      border: 2px solid var(--fg);
      background: transparent;
      appearance: none;
    }
    meter::-webkit-meter-bar {
      border: 0;
      border-radius: 0;
      background: transparent;
    }
    meter::-webkit-meter-optimum-value {
      background: var(--accent);
    }
    meter::-moz-meter-bar {
      background: var(--accent);
    }
    .achievements {
      display: grid;
      gap: var(--space-2);
      margin: 0;
      padding: 0;
      list-style: none;
    }
    li {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }
    .sprite {
      flex: none;
      width: 48px;
      height: 48px;
    }
    @media (prefers-reduced-motion: no-preference) {
      .card[open] {
        animation: press-start 320ms steps(4);
      }
    }
    @keyframes press-start {
      from {
        clip-path: inset(50% 0);
      }
    }
  `,
})
export class PlayerCard {
  protected readonly content = inject(CONTENT);
  /** Opened by the Konami code (or its taps on phones): the cheat version, maxed out, with one more achievement. */
  readonly cheat = input(false);
  protected readonly xp = computed(() => (this.cheat() ? 1 : this.content.game.xp));
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  /** The card was closed: its creator destroys it, and the next code entry makes a fresh one. */
  readonly done = output();

  open(): void {
    const dialog = this.dialog().nativeElement;
    if (!dialog.open) dialog.showModal();
  }
}
