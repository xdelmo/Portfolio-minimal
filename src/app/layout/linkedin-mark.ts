import { ChangeDetectionStrategy, Component } from '@angular/core';

/** The LinkedIn mark redrawn on a 16 × 16 pixel grid: "in" cut out of a stepped square. Decorative, the link text names it. */
@Component({
  selector: 'app-linkedin-mark',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 16 16" width="16" height="16" shape-rendering="crispEdges" fill="currentColor" fill-rule="evenodd" aria-hidden="true" focusable="false">
      <path d="M1 0h14v1h1v14h-1v1h-14v-1h-1v-14h1zM3 3h2v2h-2zM3 6h2v7h-2zM6 6h2v7h-2zM8 6h3v1h1v6h-2v-5h-2z" />
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      flex: none;
    }
  `,
})
export class LinkedinMark {}
