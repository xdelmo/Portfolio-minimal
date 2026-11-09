import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Project } from '../../content/content.model';
import { GithubMark } from '../../layout/github-mark';
import { PixelArrow } from '../../layout/pixel-arrow';
import { QuestSprite } from '../side-quests/quest-sprite';
import { Depixelate } from '../../depixelate/depixelate.directive';

@Component({
  selector: 'app-work-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NgOptimizedImage, GithubMark, QuestSprite, Depixelate, PixelArrow],
  template: `
    <ul class="projects">
      @for (project of projects(); track project.slug) {
        <li class="project" [class.project--tall]="project.image && project.image.height > project.image.width">
          <div class="text">
            <h3 [style.view-transition-name]="'title-' + project.slug"><a class="touch-line" [routerLink]="['/work', project.slug]">{{ project.title }}</a></h3>
            <p>{{ project.summary }}</p>
            <p class="role">{{ project.role }}</p>
            <ul class="stack" i18n-aria-label="@@work.stack" aria-label="Technologies">
              @for (tech of project.stack; track tech) {
                <li>{{ tech }}</li>
              }
            </ul>
            <div class="actions">
              <a class="button button--primary read" [routerLink]="['/work', project.slug]"
                ><span i18n="@@work.caseStudy">Read the case study</span><span class="visually-hidden">: {{ project.title }}</span></a
              >
              @if (project.repos.length) {
                <ul class="repos" i18n-aria-label="@@work.repos" aria-label="Code">
                  @for (repo of project.repos; track repo.url) {
                    <li><a class="repo-link" [href]="repo.url" target="_blank" aria-describedby="new-tab" rel="noopener"><app-github-mark />{{ repo.label }}</a></li>
                  }
                </ul>
              }
              @if (project.demoUrl) {
                <a class="repo-link" [href]="project.demoUrl" target="_blank" aria-describedby="new-tab" rel="noopener"
                  ><span i18n="@@work.demo">Live demo</span><span class="visually-hidden">: {{ project.title }}</span></a
                >
              }
            </div>
          </div>
          <!-- every project gets the same frame: its screenshot, or its pixel item that builds itself on scroll -->
          <a class="media" data-snap-zone [routerLink]="['/work', project.slug]" tabindex="-1" aria-hidden="true">
            @if (project.image; as image) {
              <img
                appDepixelate
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
            <span class="media-arrow" data-magnetic data-snap aria-hidden="true">
              <span class="media-arrow-label" i18n="@@work.view">View</span>
              <app-pixel-arrow />
            </span>
          </a>
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
    .role {
      color: var(--fg-muted);
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
    // the project's actions: stacked on phones, one row from md (issue #94)
    .actions {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: var(--space-2);
      margin-top: var(--space-1);
      @include bp.up(md) {
        flex-direction: row;
        flex-wrap: wrap;
        align-items: center;
      }
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
      position: relative;
      display: grid;
      // one row as tall as the frame, so a phone picture's percentage height resolves against it: with an auto row the
      // picture kept its own height and the frame cut it (issue #229)
      grid-template: minmax(0, 1fr) / minmax(0, 1fr);
      place-items: center;
      aspect-ratio: 3 / 2;
      overflow: hidden;
      border: 1px solid var(--rule);
      background: var(--surface);
      color: inherit;
      text-decoration: none;
      cursor: pointer;
    }
    .shot {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    // under smooth scroll the picture drifts inside its frame (effects/parallax.ts, speed 0.95): a screenshot that fills
    // the frame is grown by 12% so the drift never shows the frame's edge (issue #408)
    :host-context(html.smooth) .project:not(.project--tall) .shot {
      scale: 1.12;
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
    .media-arrow {
      position: absolute;
      top: var(--space-2);
      right: var(--space-2);
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-1);
      min-width: 40px;
      height: 40px;
      padding-inline: 11px; // 16px arrow + 2 * 11 + 2 * 1 border = the 40px square
      border: 1px solid var(--rule);
      background: var(--bg);
      color: var(--fg);
      @media (pointer: coarse) {
        min-width: 44px;
        height: 44px;
        padding-inline: 13px;
      }
    }
    // on hover the square becomes a labelled pill that grows to the left, like a button saying what it does
    .media-arrow-label {
      max-width: 0;
      overflow: hidden;
      margin-right: calc(-1 * var(--space-1)); // cancels the gap while folded
      opacity: 0;
      font-size: 14px;
      line-height: 1;
      white-space: nowrap;
    }
    .media-arrow app-pixel-arrow {
      width: 16px;
      height: 16px;
    }
    @media (hover: hover) {
      .media:hover .media-arrow-label {
        max-width: 5em;
        margin-right: 0;
        opacity: 1;
      }
      .media:hover .media-arrow {
        border-color: var(--accent);
        background: var(--accent);
        color: var(--on-accent);
      }
    }
    @media (hover: hover) and (prefers-reduced-motion: no-preference) {
      .media-arrow {
        transition: background-color 120ms steps(2), color 120ms steps(2), border-color 120ms steps(2);
      }
      .media-arrow app-pixel-arrow {
        transition: transform 160ms steps(2);
      }
      .media-arrow-label {
        transition:
          max-width 360ms cubic-bezier(0.22, 1, 0.36, 1),
          margin-right 360ms cubic-bezier(0.22, 1, 0.36, 1),
          opacity 200ms ease 80ms;
      }
      .media:hover .media-arrow app-pixel-arrow {
        transform: translate(2px, -2px);
      }
    }
    .media:active .media-arrow {
      transform: translate(2px, 2px);
    }
    @include bp.up(md) {
      // the text sits level with the middle of its picture, so a short description leaves no hole below it
      .project {
        grid-template-columns: 1fr 1fr;
        gap: var(--space-6);
        align-items: center;
      }
    }
    // the lead project (the first, ApexFlow) takes the whole row; the others pair up under it, each picture on top of
    // its text (issue #231: the three looked like equals)
    @include bp.up(lg) {
      .projects {
        grid-template-columns: 1fr 1fr;
        column-gap: var(--space-6);
      }
      .project:first-child {
        grid-column: 1 / -1;
      }
      .project:not(:first-child) {
        grid-template-columns: minmax(0, 1fr);
        gap: var(--space-3);
        align-items: start;
      }
      .project:not(:first-child) .media {
        order: -1;
      }
    }
  `,
})
export class WorkList {
  readonly projects = input.required<readonly Project[]>();
}
