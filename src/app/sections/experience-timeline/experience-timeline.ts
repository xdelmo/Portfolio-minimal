import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ExperienceItem } from '../../content/content.model';

@Component({
  selector: 'app-experience-timeline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ol class="timeline">
      @for (item of items(); track item.title + item.org) {
        <li>
          <p class="period">{{ item.period }}</p>
          <h3>{{ item.title }}<span class="org">, {{ item.org }}</span></h3>
          <p>{{ item.summary }}</p>
        </li>
      }
    </ol>
  `,
  styles: `
    @use 'styles/breakpoints' as bp;

    .timeline {
      display: grid;
      gap: var(--space-6);
      margin: 0;
      padding: 0 0 0 var(--space-3);
      list-style: none;
      border-left: 2px solid var(--rule);
    }
    li {
      display: grid;
      gap: var(--space-1);
    }
    .period {
      color: var(--fg-muted);
      font-size: var(--step--1);
    }
    h3 {
      font-size: var(--step-1);
    }
    .org {
      font-weight: 400;
    }
    @include bp.up(md) {
      li {
        grid-template-columns: 12rem 1fr;
        column-gap: var(--space-4);
      }
      .period {
        grid-row: span 2;
        padding-top: 0.2em;
      }
    }
  `,
})
export class ExperienceTimeline {
  readonly items = input.required<readonly ExperienceItem[]>();
}
