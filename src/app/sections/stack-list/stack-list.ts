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
  template: `
    <div class="levels">
      @for (group of groups(); track group.name; let i = $index, count = $count) {
        <section class="level" [class]="'level--' + i" [attr.aria-labelledby]="'level-' + i">
          <h3 [id]="'level-' + i">
            <span class="meter" aria-hidden="true">
              @for (cell of cells(count); track cell) {
                <i [class.on]="cell < count - i"></i>
              }
            </span>
            {{ group.name }}
          </h3>
          <ul>
            @for (item of group.items; track item) {
              <li translate="no">{{ item }}</li>
            }
          </ul>
        </section>
      }
    </div>
  `,
  styles: `
    @use 'styles/breakpoints' as bp;

    .levels {
      display: grid;
    }
    .level {
      display: grid;
      gap: var(--space-2);
      padding-block: var(--space-3);
      border-top: 1px solid var(--rule);
    }
    .level:last-child {
      border-bottom: 1px solid var(--rule);
    }
    h3,
    ul,
    li {
      margin: 0;
    }
    h3 {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      font-size: var(--step-0);
      color: var(--fg-muted);
    }
    .meter {
      display: inline-flex;
      gap: 2px;
    }
    .meter i {
      width: var(--space-1);
      height: var(--space-1);
      border: 1px solid currentColor;
    }
    .meter .on {
      background: var(--accent);
      border-color: var(--accent);
    }
    ul {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: var(--space-1) var(--gap-x);
      padding: 0;
      list-style: none;
      font-size: var(--size);
      font-weight: var(--weight);
      font-variation-settings: 'wdth' var(--wdth);
      line-height: 1.15;
    }
    li {
      white-space: nowrap;
    }
    // the depth, in type: size, weight and width step down together
    .level--0 {
      --size: var(--step-3);
      --weight: 600;
      --wdth: 85;
      --gap-x: var(--space-3);
    }
    .level--1 {
      --size: var(--step-1);
      --weight: 500;
      --wdth: 90;
      --gap-x: var(--space-3);
    }
    .level--2 {
      --size: var(--step-0);
      --weight: 400;
      --wdth: 100;
      --gap-x: var(--space-2);
      color: var(--fg-muted);
    }

    @include bp.up(md) {
      .level {
        grid-template-columns: 14rem 1fr;
        align-items: baseline;
        gap: var(--space-4);
        padding-block: var(--space-4);
      }
      .level--0 {
        --size: var(--step-5);
        --gap-x: var(--space-4);
      }
      .level--1 {
        --size: var(--step-3);
      }
      .level--2 {
        --size: var(--step-1);
        --gap-x: var(--space-3);
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
