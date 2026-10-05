import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SideQuest } from '../../content/content.model';
import { GithubMark } from '../../layout/github-mark';

@Component({
  selector: 'app-side-quests',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [GithubMark],
  template: `
    <ul class="quests">
      @for (quest of items(); track quest.title) {
        <li>
          <h3>{{ quest.title }}</h3>
          <p>{{ quest.summary }}</p>
          <p class="tags">{{ quest.tags.join(', ') }}</p>
          <a class="repo-link" [href]="quest.repo"><app-github-mark /><span i18n="@@sideQuests.repo">Code on GitHub</span></a>
        </li>
      }
    </ul>
  `,
  styles: `
    @use 'styles/breakpoints' as bp;

    .quests {
      display: grid;
      gap: var(--space-4);
      margin: 0;
      padding: 0;
      list-style: none;
    }
    li {
      display: grid;
      gap: var(--space-1);
      align-content: start;
      padding-top: var(--space-2);
      border-top: 2px solid var(--fg);
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
    @include bp.up(md) {
      .quests {
        grid-template-columns: repeat(3, 1fr);
      }
    }
  `,
})
export class SideQuests {
  readonly items = input.required<readonly SideQuest[]>();
}
