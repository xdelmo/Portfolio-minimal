import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, inject, input } from '@angular/core';
import { ExperienceItem } from '../../content/content.model';

@Component({
  selector: 'app-experience-timeline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ol class="timeline">
      @for (item of items(); track item.title + item.org; let i = $index) {
        <li [style.--i]="i">
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
    // phones and tablets: the entries are cards that stick under the header and pile up as you scroll, each 8px
    // lower than the one before, the CSS cousin of the desktop deck. Layout, not motion: it stays with reduced motion.
    @media (max-width: 1023.98px) {
      .timeline {
        padding-left: 0;
      }
      .timeline::before {
        display: none;
      }
      li {
        top: calc(var(--header-h) + var(--space-2) + var(--i, 0) * 8px);
        padding: var(--space-3);
        border: 1px solid var(--rule);
        background: var(--surface);
      }
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
    // only cards that fit whole under the header stick (set by the component): with enlarged text a taller card
    // would hide its last lines under the next one for good (WCAG 1.4.4)
    @media (max-width: 1023.98px) {
      li.sticks {
        position: sticky;
      }
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

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    let sizes: ResizeObserver | undefined;
    const measure = (): void => {
      for (const li of host.querySelectorAll<HTMLElement>('.timeline > li')) {
        li.classList.toggle('sticks', parseFloat(getComputedStyle(li).top) + li.offsetHeight <= innerHeight);
      }
    };
    afterNextRender(() => {
      measure();
      sizes = new ResizeObserver(measure);
      for (const li of host.querySelectorAll('.timeline > li')) sizes.observe(li);
      addEventListener('resize', measure);
    });
    inject(DestroyRef).onDestroy(() => {
      sizes?.disconnect();
      removeEventListener('resize', measure);
    });
  }
}
