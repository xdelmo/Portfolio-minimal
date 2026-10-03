import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Project } from '../../content/content.model';

@Component({
  selector: 'app-work-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NgOptimizedImage],
  template: `
    <ul class="projects">
      @for (project of projects(); track project.slug; let first = $first) {
        <li class="project" [class.project--tall]="project.image && project.image.height > project.image.width">
          <div class="text">
            <h3><a [routerLink]="['/work', project.slug]">{{ project.title }}</a></h3>
            <p>{{ project.summary }}</p>
            <ul class="stack" i18n-aria-label="@@work.stack" aria-label="Technologies">
              @for (tech of project.stack; track tech) {
                <li>{{ tech }}</li>
              }
            </ul>
          </div>
          @if (project.image; as image) {
            <img
              class="shot"
              [ngSrc]="image.src"
              [width]="image.width"
              [height]="image.height"
              [alt]="image.alt"
              [priority]="first"
              sizes="(min-width: 768px) 50vw, 100vw"
            />
          }
        </li>
      }
    </ul>
  `,
  styles: `
    @use 'styles/breakpoints' as bp;

    .projects {
      display: grid;
      gap: var(--space-12);
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .project {
      display: grid;
      gap: var(--space-3);
      align-items: start;
    }
    .text {
      display: grid;
      gap: var(--space-2);
    }
    h3 a {
      color: var(--fg);
    }
    .stack {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-1) var(--space-3);
      margin: 0;
      padding: 0;
      list-style: none;
      color: var(--fg-muted);
      font-size: var(--step--1);
    }
    .shot {
      width: 100%;
      height: auto;
      border: 1px solid var(--rule);
      background: var(--surface);
    }
    .project--tall .shot {
      max-width: 280px;
    }
    @include bp.up(md) {
      .project {
        grid-template-columns: 1fr 1fr;
        gap: var(--space-6);
      }
      .project--tall .shot {
        justify-self: center;
      }
    }
  `,
})
export class WorkList {
  readonly projects = input.required<readonly Project[]>();
}
