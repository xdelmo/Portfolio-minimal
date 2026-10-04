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
      position: relative;
      display: grid;
      gap: var(--space-6);
      margin: 0;
      padding: 0 0 0 var(--space-3);
      list-style: none;
    }
    .timeline::before {
      content: '';
      position: absolute;
      inset: 0 auto 0 0;
      width: 2px;
      background: var(--rule);
      transform-origin: top;
      // grows with the pinned deck on desktop (motion/effects/experience.ts)
      transform: scaleY(var(--progress, 1));
    }
    // desktop with motion: the entries share one cell and stack like cards; cards waiting below the deck stay
    // hidden, while the ones stepping back above it remain visible
    .timeline.is-stacked {
      // room for the cards stepping back above the deck, so they never cover the section title
      margin-top: var(--space-12);
      clip-path: inset(-8rem -2rem 0 -2rem);
    }
    .timeline.is-stacked > li {
      grid-area: 1 / 1;
      align-self: start;
      min-height: 14rem;
      padding: var(--space-6);
      border: 1px solid var(--rule);
      background: var(--surface);
      transform-origin: 50% 0;
    }
    .timeline.is-stacked h3 {
      font-size: var(--step-3);
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
