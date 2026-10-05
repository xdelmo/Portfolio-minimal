import { ChangeDetectionStrategy, Component } from '@angular/core';

/** The GitHub mark redrawn on a 16 × 16 pixel grid: the cat is the gap in a stepped circle. Decorative, the link text names it. */
@Component({
  selector: 'app-github-mark',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 16 16" width="16" height="16" shape-rendering="crispEdges" fill="currentColor" aria-hidden="true" focusable="false">
      <path
        d="M5 0h6v1h-6zM3 1h10v1h-10zM2 2h12v1h-12zM1 3h3v1h-3zM5 3h6v1h-6zM12 3h3v1h-3zM1 4h3v1h-3zM6 4h4v1h-4zM12 4h3v1h-3zM0 5h4v1h-4zM12 5h4v1h-4zM0 6h3v1h-3zM13 6h3v1h-3zM0 7h3v1h-3zM13 7h3v1h-3zM0 8h3v1h-3zM13 8h3v1h-3zM0 9h3v1h-3zM13 9h3v1h-3zM0 10h4v1h-4zM12 10h4v1h-4zM1 11h2v1h-2zM4 11h2v1h-2zM10 11h5v1h-5zM1 12h3v1h-3zM10 12h5v1h-5zM2 13h4v1h-4zM10 13h4v1h-4zM3 14h3v1h-3zM10 14h3v1h-3zM5 15h1v1h-1zM10 15h1v1h-1z"
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
export class GithubMark {}
