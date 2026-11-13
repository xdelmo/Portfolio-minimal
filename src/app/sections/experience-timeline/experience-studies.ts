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
  templateUrl: './experience-studies.html',
  styleUrl: './experience-studies.scss',
})
export class ExperienceStudies {
  readonly studies = input.required<readonly StudyItem[]>();
}
