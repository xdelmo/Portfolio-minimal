import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, input, viewChild } from '@angular/core';
import { SideQuest } from '../../content/content.model';
import { GithubMark } from '../../layout/github-mark';
import { QuestSprite } from './quest-sprite';

/** Side quests as a game's inventory: each one an item in its slot, with what it is and where its code lives. */
@Component({
  selector: 'app-side-quests',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [GithubMark, QuestSprite],
  templateUrl: './side-quests.html',
  styleUrl: './side-quests.scss',
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
