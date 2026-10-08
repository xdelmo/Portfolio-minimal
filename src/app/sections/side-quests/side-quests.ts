import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SideQuest } from '../../content/content.model';
import { GithubMark } from '../../layout/github-mark';
import { QuestSprite } from './quest-sprite';

/** Side quests as a game's inventory: each one an item in its slot, with what it is and where its code lives. */
@Component({
  selector: 'app-side-quests',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [GithubMark, QuestSprite],
  template: `
    <ul class="quests">
      @for (quest of items(); track quest.title) {
        <li>
          <div class="slot"><app-quest-sprite class="sprite" [name]="quest.sprite" /></div>
          <div class="text">
            <h3>{{ quest.title }}</h3>
            <p>{{ quest.summary }}</p>
            <p class="tags">{{ quest.tags.join(', ') }}</p>
            <a class="repo-link" [href]="quest.repo" target="_blank" aria-describedby="new-tab" rel="noopener"><app-github-mark /><span i18n="@@sideQuests.repo">Code on GitHub</span></a>
          </div>
        </li>
      }
    </ul>
  `,
  styles: `
    @use 'styles/breakpoints' as bp;

    .quests {
      display: grid;
      gap: var(--space-6);
      margin: 0;
      padding: 0;
      list-style: none;
    }
    li {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      gap: var(--space-3);
      align-items: start;
    }
    // an inventory slot: a hard square frame, the item drawn at 6px a cell
    .slot {
      padding: var(--space-2);
      border: 2px solid var(--fg);
      background: color-mix(in srgb, var(--surface) 55%, transparent);
    }
    .sprite {
      width: 96px;
      height: 96px;
    }
    .text {
      display: grid;
      gap: var(--space-1);
      align-content: start;
    }
    .text > * {
      margin: 0;
    }
    h3 {
      font-size: var(--step-1);
    }
    .repo-link {
      justify-self: start;
      margin-top: var(--space-1);
    }
    .tags {
      color: var(--fg-muted);
      font-size: var(--step--1);
    }
    // picking an item up: it hops in pixel steps when the pointer, the keyboard or a finger reaches its quest
    @media (prefers-reduced-motion: no-preference) {
      li:hover .sprite,
      li:focus-within .sprite,
      li:active .sprite {
        animation: hop 480ms steps(4);
      }
    }
    @keyframes hop {
      40% {
        translate: 0 -12px;
      }
    }
    @include bp.up(md) {
      .quests {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      li {
        grid-template-columns: minmax(0, 1fr);
      }
      .slot {
        justify-self: start;
      }
    }
  `,
})
export class SideQuests {
  readonly items = input.required<readonly SideQuest[]>();
}
