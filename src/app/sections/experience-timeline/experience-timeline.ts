import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ExperienceItem } from '../../content/content.model';

@Component({
  selector: 'app-experience-timeline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <!-- one chapter per job, oldest first: links to the cards, so they work without JavaScript; on desktop the deck
         fills their cells and marks the current one (motion/effects/experience.ts) -->
    <nav class="chapters" aria-label="Career chapters" i18n-aria-label="@@home.experience.chapters">
      <ol>
        @for (item of items(); track item.title + item.org; let i = $index) {
          <li>
            <a [href]="'#exp-' + i">
              <i class="cells" aria-hidden="true"></i>
              <span class="when">{{ item.period }}</span>{{ " " }}
              <span class="what">{{ item.short }}, {{ item.org }}</span>
            </a>
          </li>
        }
      </ol>
    </nav>
    <ol class="timeline">
      @for (item of items(); track item.title + item.org; let i = $index) {
        <li [id]="'exp-' + i" [style.--i]="i" tabindex="-1">
          <p class="period">{{ item.period }}</p>
          <div class="body">
            <h3>{{ item.title }}<span class="org">, {{ item.org }}</span></h3>
            <p>{{ item.summary }}</p>
            <ul class="highlights">
              @for (line of item.highlights; track line) {
                <li>{{ line }}</li>
              }
            </ul>
            <ul class="tags" aria-label="Tools" i18n-aria-label="@@home.experience.tools">
              @for (tag of item.tags; track tag) {
                <li>{{ tag }}</li>
              }
            </ul>
            @if (item.caseStudy; as study) {
              <a class="case-study" [routerLink]="['/work', study.slug]">{{ study.label }}</a>
            }
          </div>
        </li>
      }
    </ol>
  `,
  styles: `
    @use 'styles/breakpoints' as bp;

    :host {
      display: grid;
      gap: var(--space-6);
    }
    ul,
    ol {
      margin: 0;
      padding: 0;
      list-style: none;
    }
    p {
      margin: 0;
    }
    // the chapter track: one link per job, a strip of 8px cells over it. --fill (0 → 1) is driven by the deck on
    // desktop; everywhere else every chapter is lit
    .chapters ol {
      display: grid;
      grid-auto-columns: minmax(0, 1fr);
      grid-auto-flow: column;
      gap: var(--space-2);
    }
    .chapters a {
      display: grid;
      gap: 4px;
      min-height: var(--space-3);
      padding-block: var(--space-1);
      color: var(--fg);
      font-size: var(--step--1);
      text-decoration: none;
    }
    .cells {
      display: block;
      height: var(--space-1);
      background:
        linear-gradient(var(--accent), var(--accent)) 0 0 / calc(var(--fill, 1) * 100%) 100% no-repeat,
        var(--rule);
      mask: repeating-linear-gradient(to right, #000 0 8px, transparent 8px 12px);
    }
    .when {
      color: var(--fg-muted);
    }
    .what {
      font-weight: 600;
    }
    .chapters a:hover .what,
    .chapters a[aria-current] .what {
      color: var(--link);
      text-decoration: underline;
    }
    .timeline {
      position: relative;
      display: grid;
      gap: var(--space-6);
    }
    .timeline > li {
      display: grid;
      gap: var(--space-1);
    }
    .body {
      display: grid;
      gap: var(--space-2);
    }
    .highlights {
      display: grid;
      gap: var(--space-1);
      padding-left: 1.2em;
      list-style: square;
    }
    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-1);
    }
    .tags li {
      padding: 2px var(--space-1);
      border: 1px solid var(--rule);
      background: var(--bg);
      font-size: var(--step--1);
    }
    .case-study {
      justify-self: start;
    }
    // desktop with motion: the jobs share one cell and stack like cards; cards waiting below the deck stay hidden,
    // while the ones stepping back above it remain visible
    .timeline.is-stacked {
      // room for the cards stepping back above the deck (14px each), so they never cover the chapter track
      margin-top: var(--space-4);
      clip-path: inset(calc(-1 * var(--space-4)) -2rem 0 -2rem);
    }
    .timeline.is-stacked > li {
      grid-area: 1 / 1;
      align-self: start;
      padding: var(--space-4) var(--space-6);
      border: 1px solid var(--rule);
      background: var(--surface);
      transform-origin: 50% 0;
    }
    .timeline.is-stacked h3 {
      font-size: var(--step-2);
    }
    // phones and tablets: the jobs are cards that stick under the header and pile up as you scroll, each 8px lower
    // than the one before, the CSS cousin of the desktop deck. Layout, not motion: it stays with reduced motion.
    @media (max-width: 1023.98px) {
      .timeline > li {
        top: calc(var(--header-h) + var(--space-2) + var(--i, 0) * 8px);
        padding: var(--space-3);
        border: 1px solid var(--rule);
        background: var(--surface);
      }
      // only cards that fit whole under the header stick (set by the component): with enlarged text a taller card
      // would hide its last lines under the next one for good (WCAG 1.4.4)
      .timeline > li.sticks {
        position: sticky;
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
    @include bp.up(md) {
      .timeline > li {
        grid-template-columns: 12rem 1fr;
        column-gap: var(--space-4);
      }
      .period {
        padding-top: 0.2em;
      }
    }
  `,
})
export class ExperienceTimeline {
  readonly items = input.required<readonly ExperienceItem[]>();

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);
    const measure = (): void => {
      for (const li of host.querySelectorAll<HTMLElement>('.timeline > li')) {
        li.classList.toggle('sticks', parseFloat(getComputedStyle(li).top) + li.offsetHeight <= innerHeight);
      }
    };
    // browser only: the server prerenders the cards without measuring them (and has no window to listen to)
    afterNextRender(() => {
      measure();
      addEventListener('resize', measure);
      const sizes = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : undefined;
      for (const li of host.querySelectorAll('.timeline > li')) sizes?.observe(li);
      destroyRef.onDestroy(() => {
        sizes?.disconnect();
        removeEventListener('resize', measure);
      });
    });
  }
}
