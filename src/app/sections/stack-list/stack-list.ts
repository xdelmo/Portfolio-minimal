import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { StackGroup } from '../../content/content.model';

@Component({
  selector: 'app-stack-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="orbs" aria-hidden="true">
      <span class="ring"></span>
      @for (group of groups(); track group.name; let i = $index, count = $count) {
        <span [class]="'orb orb--' + (i % 4)" [style.--a.deg]="(i * 360) / count - 90">{{ group.name }}</span>
      }
    </div>
    <div class="groups">
      @for (group of groups(); track group.name) {
        <div class="group">
          <h3>{{ group.name }}</h3>
          <ul>
            @for (item of group.items; track item) {
              <li>{{ item }}</li>
            }
          </ul>
        </div>
      }
    </div>
  `,
  styles: `
    @use 'styles/breakpoints' as bp;

    :host {
      display: grid;
      gap: var(--space-8);
      align-items: center;
      // no clip here: the scattered orbs enter from the screen edges, and the body's overflow-x keeps the page width
    }
    // a diagram of the three groups: pastel orbs on a ring (decorative; GSAP gathers them on scroll)
    .orbs {
      --orb: clamp(6.5rem, 4rem + 8vw, 9.5rem);
      position: relative;
      width: min(100%, 30rem);
      aspect-ratio: 1;
      justify-self: center;
    }
    .ring {
      position: absolute;
      inset: 16%;
      border: 1px solid var(--rule);
      border-radius: 50%;
    }
    .orb {
      position: absolute;
      left: calc(50% + cos(var(--a)) * 34% - var(--orb) / 2);
      top: calc(50% + sin(var(--a)) * 34% - var(--orb) / 2);
      display: grid;
      place-items: center;
      width: var(--orb);
      aspect-ratio: 1;
      // the longest word of a label ("strumenti", "Frontend") must fit inside: a word wider than the inner box
      // overflows to the right only and pushes the label off centre
      padding: var(--space-1);
      color: var(--orb-ink);
      // idle bob and pointer push (motion/effects/stack-float.ts), apart from the scroll-scrubbed transform;
      // !important because GSAP writes an inline "translate: none" on elements whose transform it drives
      translate: var(--rx, 0px) calc(var(--ry, 0px) + var(--fy, 0px)) !important;
      font-size: clamp(1rem, 0.85rem + 0.6vw, var(--step-0));
      font-weight: 600;
      line-height: 1.15;
      text-align: center;
      text-wrap: balance;
      isolation: isolate;
    }
    .orb::before {
      content: '';
      position: absolute;
      inset: 0;
      z-index: -1;
      border-radius: 50%;
      background: radial-gradient(circle at 35% 30%, var(--from), var(--to));
      filter: blur(6px);
    }
    // a tap on an orb outlines its group for a moment (motion/effects/stack-tap.ts)
    .group {
      outline: 2px solid transparent;
      outline-offset: var(--space-1);
      transition: outline-color 0.2s steps(2);
    }
    .group.is-picked {
      outline-color: var(--accent);
    }
    .orb--0 {
      --from: var(--px-3);
      --to: var(--px-4);
    }
    .orb--1 {
      --from: var(--px-5);
      --to: var(--px-3);
    }
    .orb--2 {
      --from: var(--px-6);
      --to: var(--px-4);
    }
    .orb--3 {
      --from: var(--px-4);
      --to: var(--px-5);
    }
    .groups {
      display: grid;
      gap: var(--space-6);
    }
    .group {
      display: grid;
      gap: var(--space-2);
    }
    h3 {
      font-size: var(--step-1);
    }
    ul {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-1) var(--space-3);
      margin: 0;
      padding: 0;
      list-style: none;
    }
    @include bp.up(lg) {
      :host {
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      }
    }
  `,
})
export class StackList {
  readonly groups = input.required<readonly StackGroup[]>();
}
