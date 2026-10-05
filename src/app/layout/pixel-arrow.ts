import { ChangeDetectionStrategy, Component } from '@angular/core';

/** An arrow pointing up and right, drawn on an 8 × 8 pixel grid. Decorative: the link text says where it goes. */
@Component({
  selector: 'app-pixel-arrow',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 8 8" shape-rendering="crispEdges" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M2 0h6v1h-6zM5 1h3v1h-3zM4 2h4v1h-4zM3 3h3v1h-3zM7 3h1v1h-1zM2 4h3v1h-3zM7 4h1v1h-1zM1 5h3v1h-3zM0 6h3v1h-3zM1 7h1v1h-1z" />
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      flex: none;
    }
    svg {
      width: 100%;
      height: 100%;
    }
  `,
})
export class PixelArrow {}
