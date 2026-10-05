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
  template: `
    <div class="thread" aria-hidden="true"><span class="line"></span></div>
  `,
  styles: `
    app-thread {
      position: absolute;
      inset: 0;
      z-index: 1;
      pointer-events: none;
    }
    // 24px left of the content column, or 4px from the screen edge when there is no room
    app-thread .thread {
      position: absolute;
      inset-block: 0;
      left: max(4px, calc(max(var(--gutter), (100% - var(--container)) / 2) - 24px));
      display: none;
      width: 4px;
      background: repeating-linear-gradient(to bottom, var(--rule) 0 8px, transparent 8px 16px);
    }
    app-thread .thread.is-on {
      display: block;
    }
    app-thread .line {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: calc(var(--thread, 0) * 100%);
      background: var(--accent);
    }
    // 12px: on phones the node reaches the 16px gutter and no further
    app-thread .node {
      position: absolute;
      left: -4px;
      width: 12px;
      height: 12px;
      background: var(--bg);
      box-shadow: inset 0 0 0 2px var(--fg-muted);
    }
    app-thread .node.is-lit {
      background: var(--accent);
      box-shadow: none;
      animation: node-on 0.24s steps(3);
    }
    @keyframes node-on {
      from {
        transform: scale(2);
      }
    }
  `,
})
export class Thread {}
