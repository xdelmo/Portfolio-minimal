import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Project } from '../../content/content.model';
import { GithubMark } from '../../layout/github-mark';

@Component({
  selector: 'app-work-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NgOptimizedImage, GithubMark],
  template: `
    <ul class="projects">
      @for (project of projects(); track project.slug) {
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
                <li><a class="repo-link" [href]="repo.url"><app-github-mark />{{ repo.label }}</a></li>
              }
            </ul>
          </div>
          @if (project.image; as image) {
            <div class="media">
              <img
                class="shot"
                [ngSrc]="image.src"
                [ngSrcset]="image.width / 2 + 'w, ' + image.width + 'w'"
                [loaderParams]="{ full: image.width }"
                [width]="image.width"
                [height]="image.height"
                [alt]="image.alt"
                [sizes]="image.height > image.width ? '280px' : '(min-width: 768px) 50vw, 100vw'"
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
      gap: var(--space-8);
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
      gap: var(--space-1);
      margin: 0;
      padding: var(--space-1) 0 0;
      list-style: none;
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
    // keep in step with the 280px in the image's sizes
    .project--tall .media {
      max-width: 280px;
    }
    @include bp.up(md) {
      // the text sits level with the middle of its picture, so a short description leaves no hole below it
      .project {
        grid-template-columns: 1fr 1fr;
        gap: var(--space-6);
        align-items: center;
      }
      .project--tall .media {
        justify-self: center;
      }
    }
  `,
})
export class WorkList {
  readonly projects = input.required<readonly Project[]>();
}
