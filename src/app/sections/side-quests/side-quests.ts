import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, input, viewChild } from '@angular/core';
import { SideQuest } from '../../content/content.model';
import { GithubMark } from '../../layout/github-mark';
import { QuestSprite } from './quest-sprite';

/** Side quests as a game's inventory: each one an item in its slot, with what it is and where its code lives. */
@Component({
  selector: 'app-side-quests',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [GithubMark, QuestSprite],
  template: `
    <!-- on phones the list scrolls sideways: focusable so arrow keys scroll it too, and labelled by the section title -->
    <ul #list class="quests" tabindex="0" aria-labelledby="side-quests-title">
      @for (quest of items(); track quest.title) {
        <li>
          <div class="slot"><app-quest-sprite class="sprite" [name]="quest.sprite" /></div>
          <div class="text">
            <h3>{{ quest.title }}</h3>
            <p>{{ quest.summary }}</p>
            <p class="tags" translate="no">{{ quest.tags.join(', ') }}</p>
            @if (quest.repo) {
              <a class="repo-link" [href]="quest.repo" target="_blank" aria-describedby="new-tab" rel="noopener"><app-github-mark /><span i18n="@@sideQuests.repo">Code on GitHub</span></a>
            }
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
      // in a row of items the tallest sets the height: the others keep their text right under the slot (issue #229)
      align-content: start;
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
    // phones: an inventory bar, swiped sideways and snapping each item to the middle, the next one peeking in;
    // the item in the middle is the selected one (framed in the accent, its sprite hops)
    @media (max-width: 767.98px) {
      .quests {
        display: flex;
        margin-inline: calc(-1 * var(--gutter));
        padding: var(--space-1) var(--gutter);
        overflow-x: auto;
        scroll-snap-type: x mandatory;
        scroll-padding-inline: var(--gutter);
        overscroll-behavior-x: contain;
        touch-action: pan-x pan-y;
        scrollbar-width: none;
      }
      li {
        flex: 0 0 80%;
        grid-template-columns: minmax(0, 1fr);
        scroll-snap-align: center;
      }
      .slot {
        justify-self: start;
      }
      li.current .slot {
        border-color: var(--accent);
      }
      @media (prefers-reduced-motion: no-preference) {
        li.current .sprite {
          animation: hop 480ms steps(4);
        }
      }
    }
    // four items: two by two on tablets, one row from 1024px (issue #229)
    @include bp.up(md) {
      .quests {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      li {
        grid-template-columns: minmax(0, 1fr);
      }
      .slot {
        justify-self: start;
      }
    }
    @include bp.up(lg) {
      .quests {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
    }
  `,
})
export class SideQuests {
  readonly items = input.required<readonly SideQuest[]>();
  private readonly list = viewChild.required<ElementRef<HTMLElement>>('list');

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const list = this.list().nativeElement;
      // a thin strip down the middle of the bar: the item crossing it is the selected one (styled on phones only)
      const middle = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) entry.target.classList.toggle('current', entry.isIntersecting);
        },
        { root: list, rootMargin: '0px -49% 0px -49%' },
      );
      for (const item of list.children) middle.observe(item);
      destroyRef.onDestroy(() => { middle.disconnect(); });
    });
  }
}
