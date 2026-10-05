import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Project } from '../../content/content.model';
import { PixelDissolve } from '../../pixel-dissolve/pixel-dissolve';

@Component({
  selector: 'app-work-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NgOptimizedImage, PixelDissolve],
  template: `
    <ul class="projects">
      @for (project of projects(); track project.slug; let first = $first) {
        <li class="project" [class.project--tall]="project.image && project.image.height > project.image.width">
          <div class="text">
            <h3 [style.view-transition-name]="'title-' + project.slug"><a [routerLink]="['/work', project.slug]">{{ project.title }}</a></h3>
            <p>{{ project.summary }}</p>
            <ul class="stack" i18n-aria-label="@@work.stack" aria-label="Technologies">
              @for (tech of project.stack; track tech) {
                <li>{{ tech }}</li>
              }
            </ul>
            <ul class="repos" i18n-aria-label="@@work.repos" aria-label="Code">
              @for (repo of project.repos; track repo.url) {
                <li><a [href]="repo.url">{{ repo.label }}</a></li>
              }
            </ul>
          </div>
          @if (project.image; as image) {
            <div class="media">
              <!-- a veil of page-coloured cells that clears in steps as the image scrolls in (effects/dissolve.ts) -->
              <app-pixel-dissolve class="veil" data-scrub [cols]="24" [rows]="16" [colors]="veilColors" />
              <img
                class="shot"
                [ngSrc]="image.src"
                [ngSrcset]="image.width / 2 + 'w, ' + image.width + 'w'"
                [loaderParams]="{ full: image.width }"
                [width]="image.width"
                [height]="image.height"
                [alt]="image.alt"
                [priority]="first"
                sizes="(min-width: 768px) 50vw, 100vw"
              />
            </div>
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
    .repos {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-1) var(--space-3);
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .repos a {
      display: inline-block;
      min-height: 24px;
    }
    .media {
      position: relative;
    }
    .veil {
      position: absolute;
      inset: 0;
      z-index: 1;
    }
    // phones: the picture first, then what it is
    .media {
      order: -1;
    }
    @include bp.up(md) {
      .media {
        order: 0;
      }
    }
    .shot {
      display: block;
      width: 100%;
      height: auto;
      border: 1px solid var(--rule);
      background: var(--surface);
    }
    .project--tall .media {
      max-width: 280px;
    }
    @include bp.up(md) {
      .project {
        grid-template-columns: 1fr 1fr;
        gap: var(--space-6);
      }
      .project--tall .media {
        justify-self: center;
      }
    }
  `,
})
export class WorkList {
  protected readonly veilColors = ['--bg'];
  readonly projects = input.required<readonly Project[]>();
}
