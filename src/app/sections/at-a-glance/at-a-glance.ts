import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { GlanceItem } from '../../content/content.model';

@Component({
  selector: 'app-at-a-glance',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dl class="glance">
      @for (item of items(); track item.label) {
        <div>
          <dt>{{ item.label }}</dt>
          <dd>{{ item.value }}</dd>
        </div>
      }
    </dl>
  `,
  styles: `
    @use 'styles/breakpoints' as bp;

    .glance {
      display: grid;
      gap: var(--space-2);
      margin: 0;
      padding: var(--space-3);
      background: var(--surface);
    }
    div {
      display: grid;
      gap: 2px;
    }
    dt {
      color: var(--fg-muted);
      font-size: var(--step--1);
    }
    dd {
      margin: 0;
    }
    @include bp.up(md) {
      .glance {
        grid-template-columns: repeat(2, 1fr);
        column-gap: var(--space-4);
      }
    }
  `,
})
export class AtAGlance {
  readonly items = input.required<readonly GlanceItem[]>();
}
