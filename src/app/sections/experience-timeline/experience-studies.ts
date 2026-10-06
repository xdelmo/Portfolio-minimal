import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StudyItem } from '../../content/content.model';

/**
 * Degrees and certificates, under the jobs. Outside the pinned deck on purpose: a pinned section cannot be scrolled,
 * so anything below its fold would be out of reach while it is pinned (keyboard focus included).
 */
@Component({
  selector: 'app-experience-studies',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <h3 i18n="@@home.experience.studies">Studies and certificates</h3>
    <ul>
      @for (study of studies(); track study.title) {
        <li>
          <p class="period">{{ study.period }}</p>
          <p>
            <strong>{{ study.title }}</strong>, {{ study.org }}. {{ study.summary }}
            @if (study.caseStudy; as cs) {
              <a [routerLink]="['/work', cs.slug]">{{ cs.label }}</a>
            }
          </p>
        </li>
      }
    </ul>
  `,
  styles: `
    @use 'styles/breakpoints' as bp;

    :host {
      display: grid;
      gap: var(--space-3);
    }
    h3 {
      font-size: var(--step-1);
    }
    ul {
      display: grid;
      gap: var(--space-3);
      margin: 0;
      padding: 0;
      list-style: none;
    }
    li {
      display: grid;
      gap: 4px;
    }
    p {
      margin: 0;
    }
    .period {
      color: var(--fg-muted);
      font-size: var(--step--1);
    }
    @include bp.up(md) {
      li {
        grid-template-columns: 12rem 1fr;
        column-gap: var(--space-4);
      }
      .period {
        padding-top: 0.2em;
      }
    }
  `,
})
export class ExperienceStudies {
  readonly studies = input.required<readonly StudyItem[]>();
}
