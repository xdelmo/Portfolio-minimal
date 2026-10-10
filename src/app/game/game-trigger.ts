import { ChangeDetectionStrategy, Component, ComponentRef, DestroyRef, ViewContainerRef, afterNextRender, inject, signal } from '@angular/core';
import { LEAD_IN_MS, announceGameStart } from './game-start';
import { KONAMI, konamiStep } from './konami';
import type { PlayerCard } from './player-card';

const TAPS = 5;
/** The combo shows from the third right key: ↑ ↑ alone is someone scrolling, ↑ ↑ ↓ is someone playing. */
export const COMBO_FROM = 3;
/** The combo goes away when the keys stop. */
export const COMBO_IDLE_MS = 1500;
const TAP_WINDOW_MS = 2000;

/**
 * Listens for the ways into the easter egg: the Konami code on a keyboard, five quick taps on the logo where there
 * are no arrow keys, or the "Press start" button in the footer. Nothing is rendered until then; the card is a lazy chunk.
 */
@Component({
  selector: 'app-game-trigger',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // issue #124: a row of 8px cells in a corner, one lit for each right key of the code, gone on a wrong key or a pause;
  // decoration for a game the keys already play, so hidden from screen readers
  template: `
    @if (combo() >= COMBO_FROM) {
      <div class="combo" aria-hidden="true">
        @for (cell of cells; track cell) {
          <span [class.on]="cell < combo()"></span>
        }
      </div>
    }
  `,
  styles: `
    .combo {
      position: fixed;
      right: var(--space-2);
      bottom: var(--space-2);
      z-index: 50;
      display: flex;
      gap: 2px;
      padding: var(--space-1);
      border: 2px solid var(--fg);
      background: var(--surface);
      pointer-events: none;
    }
    span {
      width: 8px;
      height: 8px;
      box-shadow: inset 0 0 0 2px var(--fg-muted);
    }
    .on {
      background: var(--accent);
      box-shadow: none;
    }
  `,
})
export class GameTrigger {
  private readonly container = inject(ViewContainerRef);
  private card?: ComponentRef<PlayerCard>;
  private opening = false;
  protected readonly COMBO_FROM = COMBO_FROM;
  protected readonly cells = KONAMI.map((_, i) => i);
  /** How much of the code has been typed, for the combo row. */
  protected readonly combo = signal(0);

  constructor() {
    const destroyRef = inject(DestroyRef);
    let progress = 0;
    let taps: number[] = [];
    let idle = 0;
    const onKey = (event: KeyboardEvent): void => {
      if (event.ctrlKey || event.metaKey || event.altKey || isEditable(event.target)) return;
      progress = konamiStep(progress, event.key);
      this.combo.set(progress);
      clearTimeout(idle);
      idle = window.setTimeout(() => {
        this.combo.set(0);
      }, COMBO_IDLE_MS);
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
        clearTimeout(idle);
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
