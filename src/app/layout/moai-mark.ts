import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * The brand's logo (issue #334): the moai from the front, one colour, the favicon's 16 × 16 drawing cropped to its
 * 10 columns and drawn at 2px a cell. Decorative, the link's label names the site. scripts/favicon.mjs owns the drawing.
 */
@Component({
  selector: 'app-moai-mark',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="3 0 10 16" width="20" height="32" shape-rendering="crispEdges" fill="currentColor" aria-hidden="true" focusable="false">
      <path
        d="M4 0h8v1h-8zM4 1h8v1h-8zM4 2h8v1h-8zM3 3h10v1h-10zM3 4h1v1h-1zM7 4h2v1h-2zM12 4h1v1h-1zM4 5h1v1h-1zM7 5h2v1h-2zM11 5h1v1h-1zM4 6h2v1h-2zM7 6h2v1h-2zM10 6h2v1h-2zM4 7h2v1h-2zM7 7h2v1h-2zM10 7h2v1h-2zM4 8h2v1h-2zM7 8h2v1h-2zM10 8h2v1h-2zM4 9h1v1h-1zM6 9h4v1h-4zM11 9h1v1h-1zM4 10h8v1h-8zM4 11h8v1h-8zM4 12h2v1h-2zM10 12h2v1h-2zM4 13h8v1h-8zM4 14h8v1h-8zM4 15h8v1h-8z"
      />
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      flex: none;
    }
  `,
})
export class MoaiMark {}
