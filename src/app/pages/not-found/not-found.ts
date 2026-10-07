import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/seo/seo.service';
import { QuestSprite } from '../../sections/side-quests/quest-sprite';

/**
 * The 404 as a wild encounter in a Game Boy battle (issue #45): the broken link is the creature, the dialog box
 * says so and the battle menu leads back into the site. Only a homage to the style: no original sprites, fonts or
 * sounds. The menu is the game's two-by-two box in the site's frame: my work, contact, the bag (the player card of
 * the Press start easter egg) and run; it moves with the arrow keys as well as Tab, like a real one.
 */
@Component({
  selector: 'app-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, QuestSprite],
  host: { '(keydown)': 'move($event)' },
  template: `
    <section class="container battle" aria-labelledby="not-found-title">
      <div class="box status">
        <p class="name"><strong>404</strong> <span i18n="@@notFound.level">Lv. 4</span></p>
        <p class="hp">
          <label for="not-found-hp" i18n="@@notFound.hp">HP</label>
          <meter id="not-found-hp" min="0" max="1" value="1">100%</meter>
        </p>
      </div>
      <app-quest-sprite class="foe" name="wild404" />
      <div class="box frame text">
        @for (corner of corners; track corner) {
          <svg class="corner" [class]="corner" viewBox="0 0 8 8" aria-hidden="true" shape-rendering="crispEdges">
            <rect x="1" y="1" width="6" height="6" />
            <path [attr.d]="knot" />
          </svg>
        }
        <h1 id="not-found-title" i18n="@@notFound.title">A wild 404 appeared!</h1>
        <p i18n="@@notFound.text">The link may be old or mistyped. What will you do?</p>
      </div>
      <nav class="box frame menu" i18n-aria-label="@@notFound.menu" aria-label="What to do">
        @for (corner of corners; track corner) {
          <svg class="corner" [class]="corner" viewBox="0 0 8 8" aria-hidden="true" shape-rendering="crispEdges">
            <rect x="1" y="1" width="6" height="6" />
            <path [attr.d]="knot" />
          </svg>
        }
        <ul>
          <li><a class="move" routerLink="/" fragment="work" i18n="@@notFound.work">My work</a></li>
          <li><a class="move" routerLink="/" fragment="contact" i18n="@@notFound.contact">Contact</a></li>
          <li>
            <button class="move" type="button" data-press-start i18n-aria-label="@@notFound.bagLabel" aria-label="Bag: the player card">
              <span i18n="@@notFound.bag">Bag</span>
            </button>
          </li>
          <li>
            <a class="move" routerLink="/" i18n-aria-label="@@notFound.runLabel" aria-label="Run: to the home page">
              <span i18n="@@notFound.run">Run</span>
            </a>
          </li>
        </ul>
      </nav>
    </section>
  `,
  styles: `
    @use 'styles/breakpoints' as bp;

    .battle {
      display: grid;
      grid-template-columns: 1fr auto;
      grid-template-areas: 'status foe' 'text text' 'menu menu';
      align-items: center;
      gap: var(--space-3);
      padding-block: var(--space-8);
      @include bp.up(md) {
        grid-template-areas: 'status foe' 'text menu';
        gap: var(--space-4);
        padding-block: var(--space-16);
      }
    }
    .box {
      padding: var(--space-3);
      border: 4px solid var(--fg);
      background: var(--surface);
    }
    .status {
      grid-area: status;
      display: grid;
      gap: var(--space-1);
      align-self: start;
      max-width: 24rem;
    }
    .name {
      display: flex;
      justify-content: space-between;
      gap: var(--space-2);
      font-size: var(--step-1);
    }
    .hp {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      font-size: var(--step--1);
      font-weight: 600;
    }
    // the bar drawn as the player card draws it: hard edges, accent fill
    meter {
      flex: 1;
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
    .foe {
      grid-area: foe;
      width: 128px;
      height: 128px;
      @include bp.up(md) {
        width: 192px;
        height: 192px;
      }
    }
    .text {
      grid-area: text;
      display: grid;
      align-content: start;
      gap: var(--space-2);
      align-self: stretch;
    }
    h1 {
      font-size: var(--step-4);
      font-variation-settings: 'wdth' 75;
      line-height: 1.05;
    }
    // the battle frame: a thick line, a gap, a thin line, and a pixel knot on every corner, all on the 8px grid
    .frame {
      position: relative;
      box-shadow:
        inset 0 0 0 2px var(--surface),
        inset 0 0 0 4px var(--fg);
      padding: var(--space-3) var(--space-4);
    }
    .corner {
      position: absolute;
      width: var(--space-3);
      height: var(--space-3);
      color: var(--fg);
      rect {
        fill: var(--surface);
      }
      path {
        fill: currentColor;
      }
    }
    .tl {
      top: -14px;
      left: -14px;
    }
    .tr {
      top: -14px;
      right: -14px;
    }
    .bl {
      bottom: -14px;
      left: -14px;
    }
    .br {
      bottom: -14px;
      right: -14px;
    }
    .menu {
      grid-area: menu;
      align-self: stretch;
      display: grid;
      align-content: center;
    }
    // two by two, as in the game: the moves on top, the bag and the way out below
    ul {
      display: grid;
      grid-template-columns: repeat(2, max-content);
      gap: var(--space-1) var(--space-4);
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .move {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      min-height: 48px;
      padding: 0;
      border: 0;
      background: none;
      color: var(--fg);
      font: inherit;
      font-size: var(--step-2);
      font-weight: 600;
      font-variation-settings: 'wdth' 75;
      text-decoration: none;
      cursor: pointer;
    }
    // the battle menu's cursor: a stepped triangle beside the chosen move, on the first one until you choose
    .move::before {
      content: '';
      flex: none;
      width: 8px;
      height: 16px;
      background: currentColor;
      clip-path: polygon(0 0, 25% 0, 25% 12.5%, 50% 12.5%, 50% 25%, 75% 25%, 75% 37.5%, 100% 37.5%, 100% 62.5%, 75% 62.5%, 75% 75%, 50% 75%, 50% 87.5%, 25% 87.5%, 25% 100%, 0 100%);
      visibility: hidden;
    }
    .move:hover::before,
    .move:focus-visible::before,
    ul:not(:focus-within, :hover) > li:first-child .move::before {
      visibility: visible;
    }
    .move:hover {
      color: var(--link);
    }
    @media (prefers-reduced-motion: no-preference) {
      .foe {
        animation:
          appear 480ms steps(6) both,
          idle 1s steps(1, end) 480ms infinite;
      }
      h1 {
        animation: type 960ms steps(20) 240ms both;
      }
      // the header's pause button stops it, as every motion that lasts longer than 5 s (WCAG 2.2.2)
      :host-context([data-motion-paused]) .foe {
        animation-play-state: paused;
      }
    }
    @keyframes appear {
      from {
        translate: 100vw 0;
      }
    }
    // the wild creature waits for your move, bobbing in two frames like a battle sprite
    @keyframes idle {
      50% {
        transform: translateY(calc(-1 * var(--space-1)));
      }
    }
    // the dialog box types its line out, a few letters at a time
    @keyframes type {
      from {
        clip-path: inset(0 100% 0 0);
      }
      to {
        clip-path: inset(0);
      }
    }
  `,
})
export class NotFound {
  constructor() {
    const seo = inject(SeoService);
    seo.update({ path: '/404', title: 'Emanuele Del Monte', description: '', noindex: true });
    seo.setJsonLd('ld-page', null);
  }

  protected readonly corners = ['tl', 'tr', 'bl', 'br'];
  /** The corner knot, 8 × 8 cells: a ring with a square inside, drawn on the frame's lines. */
  protected readonly knot =
    'M2 0h4v1h-4zM1 1h1v1h-1zM6 1h1v1h-1zM0 2h1v4h-1zM7 2h1v4h-1zM2 2h4v1h-4zM2 3h1v2h-1zM5 3h1v2h-1zM2 5h4v1h-4zM1 6h1v1h-1zM6 6h1v1h-1zM2 7h4v1h-4z';

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
