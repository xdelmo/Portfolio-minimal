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

    // straight on the band: big values under small labels, a rule above each
    .glance {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: var(--space-3) var(--space-3);
      margin: 0;
    }
    div {
      display: grid;
      align-content: start;
      gap: var(--space-1);
      padding-top: var(--space-2);
      border-top: 1px solid var(--rule);
    }
    dt {
      color: var(--fg-muted);
      font-size: var(--step--1);
    }
    dd {
      margin: 0;
      font-size: clamp(var(--step-0), 1rem + 0.6vw, var(--step-1));
      font-weight: 600;
      line-height: 1.25;
      font-variation-settings: 'wdth' 85;
    }
    @include bp.up(md) {
      .glance {
        grid-template-columns: repeat(3, minmax(0, 1fr));
        column-gap: var(--space-4);
      }
    }
  `,
})
export class AtAGlance {
  readonly items = input.required<readonly GlanceItem[]>();
}
