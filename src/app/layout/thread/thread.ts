import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

/**
 * The pixel thread down the left margin of the home page: a dashed track, an accent line that grows with the scroll
 * and one node per section (added and lit by motion/effects/thread.ts). Hidden until that effect runs.
 */
@Component({
  selector: 'app-thread',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // unscoped: the nodes are created by the effect, outside Angular's templates
  encapsulation: ViewEncapsulation.None,
  templateUrl: './thread.html',
  styleUrl: './thread.scss',
})
export class Thread {}
