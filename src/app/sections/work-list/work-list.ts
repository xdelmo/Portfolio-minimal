import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Project } from '../../content/content.model';
import { GithubMark } from '../../layout/github-mark';
import { PixelArrow } from '../../layout/pixel-arrow';
import { QuestSprite } from '../side-quests/quest-sprite';
import { Depixelate } from '../../depixelate/depixelate.directive';

@Component({
  selector: 'app-work-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NgOptimizedImage, GithubMark, QuestSprite, Depixelate, PixelArrow],
  templateUrl: './work-list.html',
  styleUrl: './work-list.scss',
})
export class WorkList {
  readonly projects = input.required<readonly Project[]>();
}
