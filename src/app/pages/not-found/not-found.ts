import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/seo/seo.service';
import { NutellaFigure } from '../../voxel/nutella-figure/nutella-figure';
import type { NutellaMood } from '../../voxel/nutella.motion';

/**
 * The 404 as a wild encounter in a Game Boy battle (issue #45): the broken link is the creature, the dialog box
 * says so and the battle menu leads back into the site. Only a homage to the style: no original sprites, fonts or
 * sounds. The menu is the game's two-by-two box in the site's frame: my work, contact, the bag (the player card of
 * the Press start easter egg) and run; it moves with the arrow keys as well as Tab, like a real one. As in the game,
 * the dialog box says what the move under the cursor does, so the game words are never the only hint. The wild one is
 * Nutella, a voxel chihuahua drawn like the moai (issues #632, #639): her still render sits there from the first paint,
 * Three.js loads once she is in view, and hovering a move shifts her mood.
 */
@Component({
  selector: 'app-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NutellaFigure],
  host: { '(keydown)': 'move($event)', '(mouseover)': 'say($event)', '(focusin)': 'say($event)', '(mouseleave)': 'leave()', '(focusout)': 'leave()' },
  templateUrl: './not-found.html',
  styleUrl: './not-found.scss',
})
export class NotFound {
  private readonly barkLine = $localize`:@@notFound.bark:Nutella used Bark!`;
  private barkTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    const seo = inject(SeoService);
    seo.update({ path: '/404', title: $localize`:@@notFound.pageTitle:Page not found — Emanuele Del Monte`, description: '', noindex: true });
    seo.setJsonLd('ld-page', null);
    inject(DestroyRef).onDestroy(() => {
      if (this.barkTimer !== null) clearTimeout(this.barkTimer);
    });
  }

  protected readonly corners = ['tl', 'tr', 'bl', 'br'];
  /** The corner knot, 8 × 8 cells: a ring with a square inside, drawn on the frame's lines. */
  protected readonly knot =
    'M2 0h4v1h-4zM1 1h1v1h-1zM6 1h1v1h-1zM0 2h1v4h-1zM7 2h1v4h-1zM2 2h4v1h-4zM2 3h1v2h-1zM5 3h1v2h-1zM2 5h4v1h-4zM1 6h1v1h-1zM6 6h1v1h-1zM2 7h4v1h-4z';

  /** What the move under the cursor does; the dialog box shows it in place of its prompt. */
  protected readonly hint = signal<string | null>(null);
  protected readonly mood = signal<NutellaMood>('idle');

  protected say(event: Event): void {
    const target = (event.target as Element).closest('.move');
    this.hint.set(target?.getAttribute('data-hint') ?? null);
    this.mood.set((target?.getAttribute('data-mood') as NutellaMood | null) ?? 'idle');
  }

  protected leave(): void {
    this.hint.set(null);
    this.mood.set('idle');
  }

  protected bark(): void {
    if (this.barkTimer !== null) clearTimeout(this.barkTimer);
    this.hint.set(this.barkLine);
    this.barkTimer = setTimeout(() => {
      this.barkTimer = null;
      if (this.hint() === this.barkLine) this.hint.set(null);
    }, 1600);
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
