import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Project } from '../../content/content.model';
import { GithubMark } from '../../layout/github-mark';
import { QuestSprite } from '../side-quests/quest-sprite';

@Component({
  selector: 'app-work-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NgOptimizedImage, GithubMark, QuestSprite],
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
            <a class="button button--primary read" [routerLink]="['/work', project.slug]"
              ><span i18n="@@work.caseStudy">Read the case study</span><span class="visually-hidden">: {{ project.title }}</span></a
            >
            <ul class="repos" i18n-aria-label="@@work.repos" aria-label="Code">
              @for (repo of project.repos; track repo.url) {
                <li><a class="repo-link" [href]="repo.url" target="_blank" aria-describedby="new-tab" rel="noopener"><app-github-mark />{{ repo.label }}</a></li>
              }
            </ul>
          </div>
          <!-- every project gets the same frame: its screenshot, or its pixel item that builds itself on scroll -->
          <div class="media">
            @if (project.image; as image) {
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
            } @else if (project.sprite; as sprite) {
              <app-quest-sprite class="item" [name]="sprite" />
            }
          </div>
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
    // the case study first, the code after it, smaller
    .read {
      justify-self: start;
      margin-top: var(--space-1);
    }
    .repos {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-1);
      margin: 0;
      padding: 0;
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
    // one 3:2 window for every project: a desktop screenshot fills it, a phone one stands in it whole, a pixel item sits
    // in its middle
    .media {
      display: grid;
      place-items: center;
      aspect-ratio: 3 / 2;
      overflow: hidden;
      border: 1px solid var(--rule);
      background: var(--surface);
    }
    .shot {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    // keep in step with the 280px in the image's sizes
    .project--tall .shot {
      width: auto;
      max-width: 280px;
      height: calc(100% - 2 * var(--space-3));
      object-fit: contain;
    }
    .item {
      width: 36%;
      aspect-ratio: 1;
    }
    @include bp.up(md) {
      // the text sits level with the middle of its picture, so a short description leaves no hole below it
      .project {
        grid-template-columns: 1fr 1fr;
        gap: var(--space-6);
        align-items: center;
      }
    }
  `,
})
export class WorkList {
  readonly projects = input.required<readonly Project[]>();
}
