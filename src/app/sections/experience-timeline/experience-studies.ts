import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StudyItem } from '../../content/content.model';
import { QuestSprite } from '../side-quests/quest-sprite';

/**
 * Degrees and certificates, under the jobs, as unlocked achievements: each one with the pixel item the player card
 * gives it, built as it scrolls in (effects/dissolve.ts). Outside the pinned deck on purpose: a pinned section cannot
 * be scrolled, so anything below its fold would be out of reach while it is pinned (keyboard focus included).
 */
@Component({
  selector: 'app-experience-studies',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, QuestSprite],
  template: `
    <h3 i18n="@@home.experience.studies">Studies and certificates</h3>
    <ul>
      @for (study of studies(); track study.title) {
        <li>
          <app-quest-sprite class="sprite" [name]="study.sprite" />
          <div class="text">
            <h4>{{ study.title }}</h4>
            <p class="meta">{{ study.org }}, {{ study.period }}</p>
            <p>{{ study.summary }}</p>
            @if (study.caseStudy; as cs) {
              <a [routerLink]="['/work', cs.slug]">{{ cs.label }}</a>
            }
          </div>
        </li>
      }
    </ul>
  `,
  styles: `
    @use 'styles/breakpoints' as bp;

    :host {
      display: grid;
      gap: var(--space-3);
    }
    h3 {
      font-size: var(--step-1);
    }
    ul {
      display: grid;
      gap: var(--space-3);
      margin: 0;
      padding: 0;
      list-style: none;
    }
    li {
      display: grid;
      grid-template-columns: var(--space-8) 1fr;
      column-gap: var(--space-3);
      align-items: start;
      padding: var(--space-3);
      border: 1px solid var(--rule);
    }
    .sprite {
      width: var(--space-8);
      height: var(--space-8);
    }
    .text {
      display: grid;
      gap: 4px;
    }
    h4 {
      margin: 0;
      font-size: var(--step-0);
      font-weight: 600;
    }
    p {
      margin: 0;
    }
    .meta {
      color: var(--fg-muted);
      font-size: var(--step--1);
    }
    a {
      justify-self: start;
      margin-top: 4px;
    }
    // three tiles side by side, never two and an orphan
    @include bp.up(lg) {
      ul {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      // a third of the column is too narrow for a sprite beside the words: it sits above them
      li {
        grid-template-columns: 1fr;
        align-content: start;
        row-gap: var(--space-2);
      }
    }
  `,
})
export class ExperienceStudies {
  readonly studies = input.required<readonly StudyItem[]>();
}
