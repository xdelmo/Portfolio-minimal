import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, input, linkedSignal, output, viewChild } from '@angular/core';
import { CONTENT } from '../content/content';
import { MOTION_LOADER } from '../motion/motion-host';
import { QuestSprite } from '../sections/side-quests/quest-sprite';
import { readExplored } from './explorer';

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
  templateUrl: './player-card.html',
  styleUrl: './player-card.scss',
})
export class PlayerCard {
  protected readonly content = inject(CONTENT);
  protected readonly total = this.content.projects.length;
  protected readonly explored = readExplored(this.content.projects.map((p) => p.slug)).length;
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
    // showModal focuses the one button, at the bottom, and scrolls there: open from the title (issue #467)
    dialog.scrollTop = 0;
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
