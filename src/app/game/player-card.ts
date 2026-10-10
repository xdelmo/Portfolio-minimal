import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, input, linkedSignal, output, viewChild } from '@angular/core';
import { CONTENT } from '../content/content';
import { MOTION_LOADER } from '../motion/motion-host';
import { QuestSprite } from '../sections/side-quests/quest-sprite';

/** The cheat card's level up: the level climbs to this, the experience bar fills, the new achievement steps in. */
export const MAX_LEVEL = 99;

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
          <dd translate="no">{{ content.game.player }}</dd>
        </div>
        <div>
          <dt i18n="@@game.class">Class</dt>
          <dd>{{ content.person.role }}</dd>
        </div>
        <div>
          <dt i18n="@@game.level">Level</dt>
          <dd class="level">{{ level() }}</dd>
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
          <li class="unlocked" #unlocked>
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
      // scrolled to its end, the card does not hand the scroll to the page behind (issue #135)
      overscroll-behavior: contain;
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
    // every digit the same width, so the climbing level does not jitter (issue #135)
    .level {
      font-variant-numeric: tabular-nums;
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
    // the level up's pixels (issue #124): created and removed by levelUp(), outside Angular's style scope
    :host ::ng-deep .burst {
      position: absolute;
      width: 8px;
      height: 8px;
      pointer-events: none;
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
  private readonly loadMotion = inject(MOTION_LOADER);
  /** Opened by the Konami code (or its taps on phones): the cheat version, maxed out, with one more achievement. */
  readonly cheat = input(false);
  /** The cheat card levels up (issue #124), unless motion is reduced: then it opens maxed out. */
  private readonly levelsUp = (): boolean => this.cheat() && matchMedia('(prefers-reduced-motion: no-preference)').matches;
  // what the card shows from its first render; the level up moves them
  protected readonly level = linkedSignal(() => (this.cheat() && !this.levelsUp() ? MAX_LEVEL : this.content.game.level));
  protected readonly xp = linkedSignal(() => (this.cheat() && !this.levelsUp() ? 1 : this.content.game.xp));
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly unlocked = viewChild<ElementRef<HTMLElement>>('unlocked');
  /** The card was closed: its creator destroys it, and the next code entry makes a fresh one. */
  readonly done = output();
  private stop?: () => void;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.stop?.();
    });
  }

  open(): void {
    const dialog = this.dialog().nativeElement;
    if (!dialog.open) dialog.showModal();
    if (this.levelsUp()) void this.levelUp();
  }

  /**
   * Level up, about 1.5 s after the card's own opening: the level and the bar climb in steps like an old game's
   * counter, the unlocked achievement steps in from below, a handful of pastel pixels jump out of the level.
   */
  private async levelUp(): Promise<void> {
    const { level, xp } = this.content.game;
    let gsap: Awaited<ReturnType<typeof this.loadMotion>>['gsap'];
    try {
      ({ gsap } = await this.loadMotion());
    } catch {
      // no motion library: the card still ends maxed out
      this.level.set(MAX_LEVEL);
      this.xp.set(1);
      return;
    }
    const dialog = this.dialog().nativeElement;
    const from = dialog.querySelector<HTMLElement>('.level');
    const unlocked = this.unlocked()?.nativeElement;
    const counter = { level, xp };
    const pixels = Array.from({ length: 10 }, (_, i) => {
      const pixel = document.createElement('span');
      pixel.className = 'burst';
      pixel.setAttribute('aria-hidden', 'true');
      pixel.style.background = `var(--px-${String((i % 6) + 1)})`;
      dialog.append(pixel);
      return pixel;
    });
    const box = dialog.getBoundingClientRect();
    const at = from?.getBoundingClientRect();
    // from the middle of the level's number
    gsap.set(pixels, { left: at ? at.left + at.width / 2 - 4 - box.left + dialog.scrollLeft : 0, top: at ? at.top + at.height / 2 - 4 - box.top + dialog.scrollTop : 0, autoAlpha: 0 });
    if (unlocked) gsap.set(unlocked, { yPercent: 100, autoAlpha: 0 });
    const timeline = gsap.timeline({ delay: 0.35 });
    timeline.to(counter, {
      level: MAX_LEVEL,
      xp: 1,
      duration: 1,
      ease: 'steps(12)',
      onUpdate: () => {
        this.level.set(Math.round(counter.level));
        this.xp.set(counter.xp);
      },
    });
    timeline.to(pixels, { autoAlpha: 1, duration: 0.01 }, '<0.85');
    timeline.to(pixels, {
      x: (i: number) => (i - 4.5) * 14,
      y: -48,
      duration: 0.3,
      ease: 'steps(3)',
      stagger: { each: 0.02, from: 'center' },
    }, '<');
    timeline.to(pixels, { y: 40, autoAlpha: 0, duration: 0.4, ease: 'steps(4)', stagger: { each: 0.02, from: 'center' } }, '>');
    if (unlocked) timeline.to(unlocked, { yPercent: 0, autoAlpha: 1, duration: 0.32, ease: 'steps(4)' }, '<');
    this.stop = () => {
      timeline.kill();
      for (const pixel of pixels) pixel.remove();
    };
    timeline.eventCallback('onComplete', () => {
      for (const pixel of pixels) pixel.remove();
    });
  }
}
