import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { StackGroup } from '../../content/content.model';

@Component({
  selector: 'app-stack-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="groups">
      @for (group of groups(); track group.name) {
        <div class="group">
          <h3>{{ group.name }}</h3>
          <ul>
            @for (item of group.items; track item) {
              <li>{{ item }}</li>
            }
          </ul>
        </div>
      }
    </div>
  `,
  styles: `
    @use 'styles/breakpoints' as bp;

    .groups {
      display: grid;
      gap: var(--space-6);
    }
    .group {
      display: grid;
      gap: var(--space-2);
    }
    h3 {
      font-size: var(--step-1);
    }
    ul {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-1) var(--space-3);
      margin: 0;
      padding: 0;
      list-style: none;
    }
    @include bp.up(md) {
      .groups {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `,
})
export class StackList {
  readonly groups = input.required<readonly StackGroup[]>();
}
