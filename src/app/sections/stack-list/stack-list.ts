import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { StackGroup } from '../../content/content.model';

/**
 * The tools by level, and the type size is the level: what I use every day is set large, what runs in production
 * smaller, what I try on my own at body size and muted. Each level is a row under a rule, its name and a pixel meter
 * (3, 2, 1 lit cells) on the left from md, above the tools below it.
 */
@Component({
  selector: 'app-stack-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './stack-list.html',
  styleUrl: './stack-list.scss',
})
export class StackList {
  readonly groups = input.required<readonly StackGroup[]>();

  protected cells(count: number): number[] {
    return Array.from({ length: count }, (_, i) => i);
  }
}
