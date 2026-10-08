import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { StackGroup } from '../../content/content.model';

/**
 * The tools by level, from the middle out: what I use every day, what runs in production, what I try on my own.
 * One list in the DOM: from lg the levels are concentric rings with the tools as tags around them, below it they
 * are rows that step right. A pixel meter (3, 2, 1 lit cells) carries the depth in both layouts.
 */
@Component({
  selector: 'app-stack-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="levels">
      @for (group of groups(); track group.name; let i = $index, count = $count) {
        <section class="level" [style.--i]="i" [style.--n]="group.items.length + 1" [attr.aria-labelledby]="'level-' + i">
          <h3 [id]="'level-' + i">
            <span class="meter" aria-hidden="true">
              @for (cell of cells(count); track cell) {
                <i [class.on]="cell < count - i"></i>
              }
            </span>
            {{ group.name }}
          </h3>
          <ul>
            @for (item of group.items; track item; let j = $index) {
              <li [style.--k]="j + 1">{{ item }}</li>
            }
          </ul>
        </section>
      }
    </div>
  `,
  styles: `
    @use 'styles/breakpoints' as bp;

    // phones and tablets: rows that step right, one step per level
    .levels {
      display: grid;
      gap: var(--space-6);
    }
    .level {
      display: grid;
      gap: var(--space-2);
      margin-left: calc(var(--i) * var(--space-3));
    }
    h3 {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      font-size: var(--step-1);
    }
    .meter {
      display: inline-flex;
      gap: 2px;
    }
    .meter i {
      width: var(--space-1);
      height: var(--space-1);
      border: 1px solid var(--fg);
    }
    .meter .on {
      background: var(--accent);
      border-color: var(--accent);
    }
    ul {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-1);
      margin: 0;
      padding: 0;
      list-style: none;
    }
    li,
    h3 {
      margin: 0;
    }
    li {
      padding: 2px var(--space-1);
      border: 1px solid var(--rule);
      background: var(--surface);
      white-space: nowrap;
    }

    // desktop: concentric rings, the level name at the top of its ring and the tools spread around it
    @include bp.up(lg) {
      .levels {
        // never taller than the screen under the header, so the outer ring's name is always in view
        --size: min(100%, 46rem, calc(100svh - var(--header-h) - var(--space-4)));
        position: relative;
        display: block;
        width: var(--size);
        aspect-ratio: 1;
        margin-inline: auto;
      }
      .level {
        --d: calc(42% + var(--i) * 29%);
        position: absolute;
        top: calc(50% - var(--d) / 2);
        left: calc(50% - var(--d) / 2);
        z-index: calc(3 - var(--i));
        display: block;
        width: var(--d);
        aspect-ratio: 1;
        margin: 0;
        border: 1px solid var(--rule);
        border-radius: 50%;
        pointer-events: none;
      }
      // light, not decoration: a soft pastel glow inside each ring
      .level::before {
        content: '';
        position: absolute;
        inset: 0;
        z-index: -1;
        border-radius: 50%;
        background: radial-gradient(circle, transparent 55%, var(--ring) 100%);
        opacity: 0.35;
      }
      .level:nth-child(1) {
        --ring: var(--px-2);
      }
      .level:nth-child(2) {
        --ring: var(--px-4);
      }
      .level:nth-child(3) {
        --ring: var(--px-6);
      }
      // slot 0 of each ring is its name, at the top; the tools take the other slots, evenly
      h3,
      li {
        position: absolute;
        left: calc(50% + cos(var(--angle)) * 50%);
        top: calc(50% + sin(var(--angle)) * 50%);
        translate: -50% -50%;
        pointer-events: auto;
      }
      h3 {
        --angle: -90deg;
        padding: 2px var(--space-1);
        background: var(--bg);
        font-size: var(--step-0);
        white-space: nowrap;
      }
      li {
        --angle: calc(-90deg + var(--k) * 360deg / var(--n));
      }
      ul {
        display: block;
      }
    }
  `,
})
export class StackList {
  readonly groups = input.required<readonly StackGroup[]>();

  protected cells(count: number): number[] {
    return Array.from({ length: count }, (_, i) => i);
  }
}
