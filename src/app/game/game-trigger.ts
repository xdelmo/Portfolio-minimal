import { ChangeDetectionStrategy, Component, ComponentRef, DestroyRef, ViewContainerRef, afterNextRender, inject } from '@angular/core';
import { LEAD_IN_MS, announceGameStart } from './game-start';
import { KONAMI, konamiStep } from './konami';
import type { PlayerCard } from './player-card';

const TAPS = 5;
const TAP_WINDOW_MS = 2000;

/**
 * Listens for the ways into the easter egg: the Konami code on a keyboard, five quick taps on the logo where there
 * are no arrow keys, or the "Press start" button in the footer. Nothing is rendered until then; the card is a lazy chunk.
 */
@Component({
  selector: 'app-game-trigger',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class GameTrigger {
  private readonly container = inject(ViewContainerRef);
  private card?: ComponentRef<PlayerCard>;
  private opening = false;

  constructor() {
    const destroyRef = inject(DestroyRef);
    let progress = 0;
    let taps: number[] = [];
    const onKey = (event: KeyboardEvent): void => {
      if (event.ctrlKey || event.metaKey || event.altKey || isEditable(event.target)) return;
      progress = konamiStep(progress, event.key);
      if (progress === KONAMI.length) {
        progress = 0;
        void this.open(true);
      }
    };
    const onClick = (event: MouseEvent): void => {
      if (!(event.target instanceof Element)) return;
      if (event.target.closest('[data-press-start]')) {
        void this.open(false);
        return;
      }
      if (!event.target.closest('.logo')) return;
      const now = event.timeStamp;
      taps = [...taps.filter((t) => now - t < TAP_WINDOW_MS), now];
      if (taps.length >= TAPS) {
        taps = [];
        void this.open(true);
      }
    };
    // browser only: the server has no document to listen to
    afterNextRender(() => {
      document.addEventListener('keydown', onKey);
      document.addEventListener('click', onClick);
      destroyRef.onDestroy(() => {
        document.removeEventListener('keydown', onKey);
        document.removeEventListener('click', onClick);
      });
    });
  }

  /** `cheat`: the Konami code and its taps unlock the cheat card; Press start opens the plain one. */
  private async open(cheat: boolean): Promise<void> {
    if (this.card || this.opening) return;
    this.opening = true;
    // the hero answers with a level up when it can be seen: the card waits for it, loading meanwhile
    const leadIn = announceGameStart() ? new Promise((resolve) => setTimeout(resolve, LEAD_IN_MS)) : null;
    let PlayerCard: typeof import('./player-card').PlayerCard;
    try {
      [{ PlayerCard }] = await Promise.all([import('./player-card'), leadIn]);
    } finally {
      this.opening = false;
    }
    const card = this.container.createComponent(PlayerCard);
    card.setInput('cheat', cheat);
    this.card = card;
    card.instance.done.subscribe(() => {
      card.destroy();
      this.card = undefined;
    });
    card.changeDetectorRef.detectChanges();
    card.instance.open();
  }
}

function isEditable(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
}
