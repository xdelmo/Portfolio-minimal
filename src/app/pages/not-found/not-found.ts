import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/seo/seo.service';
import { QuestSprite } from '../../sections/side-quests/quest-sprite';

/**
 * The 404 as a wild encounter in a Game Boy battle (issue #45): the broken link is the creature, the dialog box
 * says so and the battle menu leads back into the site. Only a homage to the style: no original sprites, fonts or
 * sounds. The menu is the game's two-by-two box in the site's frame: my work, contact, the bag (the player card of
 * the Press start easter egg) and run; it moves with the arrow keys as well as Tab, like a real one. As in the game,
 * the dialog box says what the move under the cursor does, so the game words are never the only hint.
 */
@Component({
  selector: 'app-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, QuestSprite],
  host: { '(keydown)': 'move($event)', '(mouseover)': 'say($event)', '(focusin)': 'say($event)', '(mouseleave)': 'hint.set(null)', '(focusout)': 'hint.set(null)' },
  templateUrl: './not-found.html',
  styleUrl: './not-found.scss',
})
export class NotFound {
  constructor() {
    const seo = inject(SeoService);
    seo.update({ path: '/404', title: $localize`:@@notFound.pageTitle:Page not found — Emanuele Del Monte`, description: '', noindex: true });
    seo.setJsonLd('ld-page', null);
  }

  protected readonly corners = ['tl', 'tr', 'bl', 'br'];
  /** The corner knot, 8 × 8 cells: a ring with a square inside, drawn on the frame's lines. */
  protected readonly knot =
    'M2 0h4v1h-4zM1 1h1v1h-1zM6 1h1v1h-1zM0 2h1v4h-1zM7 2h1v4h-1zM2 2h4v1h-4zM2 3h1v2h-1zM5 3h1v2h-1zM2 5h4v1h-4zM1 6h1v1h-1zM6 6h1v1h-1zM2 7h4v1h-4z';

  /** What the move under the cursor does; the dialog box shows it in place of its prompt. */
  protected readonly hint = signal<string | null>(null);

  protected say(event: Event): void {
    this.hint.set((event.target as Element).closest('.move')?.getAttribute('data-hint') ?? null);
  }

  /** The arrows move round the two-by-two menu as in the game: left and right in a row, up and down between rows. */
  protected move(event: KeyboardEvent): void {
    const step = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 2, ArrowUp: -2 }[event.key];
    if (!step) return;
    const links = [...(event.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('.menu .move')];
    const current = links.indexOf(event.target as HTMLElement);
    if (current < 0) return;
    links[(current + step + links.length) % links.length]?.focus();
    event.preventDefault();
  }
}
