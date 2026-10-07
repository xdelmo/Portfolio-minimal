import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/seo/seo.service';
import { QuestSprite } from '../../sections/side-quests/quest-sprite';

/**
 * The 404 as a wild encounter in a Game Boy battle (issue #45): the broken link is the creature, the dialog box
 * says so and the battle menu leads back into the site. Only a homage to the style: no original sprites, fonts or
 * sounds. The menu moves with the arrow keys as well as Tab, like a real one.
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
      <div class="box text">
        <h1 id="not-found-title" i18n="@@notFound.title">A wild 404 appeared!</h1>
        <p i18n="@@notFound.text">The link may be old or mistyped. What will you do?</p>
      </div>
      <nav class="box menu" i18n-aria-label="@@notFound.menu" aria-label="What to do">
        <ul>
          <li><a routerLink="/" i18n="@@notFound.run">Run home</a></li>
          <li><a routerLink="/" fragment="work" i18n="@@notFound.work">See my work</a></li>
          <li><a routerLink="/" fragment="contact" i18n="@@notFound.contact">Contact me</a></li>
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
    .menu {
      grid-area: menu;
      align-self: stretch;
    }
    ul {
      display: grid;
      gap: var(--space-1);
      margin: 0;
      padding: 0;
      list-style: none;
    }
    a {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      min-height: 48px;
      color: var(--fg);
      font-weight: 600;
      text-decoration: none;
    }
    // the battle menu's cursor: a stepped triangle beside the chosen move
    a::before {
      content: '';
      flex: none;
      width: 8px;
      height: 16px;
      background: currentColor;
      clip-path: polygon(0 0, 25% 0, 25% 12.5%, 50% 12.5%, 50% 25%, 75% 25%, 75% 37.5%, 100% 37.5%, 100% 62.5%, 75% 62.5%, 75% 75%, 50% 75%, 50% 87.5%, 25% 87.5%, 25% 100%, 0 100%);
      visibility: hidden;
    }
    a:hover::before,
    a:focus-visible::before {
      visibility: visible;
    }
    a:hover {
      color: var(--link);
    }
    @media (prefers-reduced-motion: no-preference) {
      .foe {
        animation: appear 480ms steps(6) both;
      }
      h1 {
        animation: type 960ms steps(20) 240ms both;
      }
    }
    @keyframes appear {
      from {
        translate: 100vw 0;
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

  /** Up and down move between the moves, wrapping round, as in a game menu. */
  protected move(event: KeyboardEvent): void {
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
    if (!step) return;
    const links = [...(event.currentTarget as HTMLElement).querySelectorAll<HTMLAnchorElement>('.menu a')];
    const current = links.indexOf(event.target as HTMLAnchorElement);
    if (current < 0) return;
    links[(current + step + links.length) % links.length]?.focus();
    event.preventDefault();
  }
}
