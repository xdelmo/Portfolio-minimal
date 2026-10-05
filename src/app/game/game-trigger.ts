import { ChangeDetectionStrategy, Component, ComponentRef, DestroyRef, ViewContainerRef, afterNextRender, inject } from '@angular/core';
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

  constructor() {
    const destroyRef = inject(DestroyRef);
    let progress = 0;
    let taps: number[] = [];
    const onKey = (event: KeyboardEvent): void => {
      if (event.ctrlKey || event.metaKey || event.altKey || isEditable(event.target)) return;
      progress = konamiStep(progress, event.key);
      if (progress === KONAMI.length) {
        progress = 0;
        void this.open();
      }
    };
    const onClick = (event: MouseEvent): void => {
      if (!(event.target instanceof Element)) return;
      if (event.target.closest('[data-press-start]')) {
        void this.open();
        return;
      }
      if (!event.target.closest('.logo')) return;
      const now = event.timeStamp;
      taps = [...taps.filter((t) => now - t < TAP_WINDOW_MS), now];
      if (taps.length >= TAPS) {
        taps = [];
        void this.open();
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

  private async open(): Promise<void> {
    if (this.card) return;
    const { PlayerCard } = await import('./player-card');
    const card = this.container.createComponent(PlayerCard);
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
