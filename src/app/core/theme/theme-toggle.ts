import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ThemeService } from './theme.service';

@Component({
  selector: 'app-theme-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" class="theme-toggle" (click)="themes.toggle()" [attr.aria-label]="label()">
      <svg viewBox="0 0 8 8" width="24" height="24" shape-rendering="crispEdges" aria-hidden="true">
        @if (themes.theme() === 'dark') {
          <path fill="currentColor" d="M3 0h2v1H3zM3 7h2v1H3zM0 3h1v2H0zM7 3h1v2H7zM1 1h1v1H1zM6 1h1v1H6zM1 6h1v1H1zM6 6h1v1H6zM2 2h4v4H2z" />
        } @else {
          <path fill="currentColor" d="M2 0h4v1H2zM1 1h2v1H1zM0 2h2v4H0zM1 6h2v1H1zM6 6h2v1H6zM2 7h5v1H2z" />
        }
      </svg>
    </button>
  `,
  styles: `
    .theme-toggle {
      display: grid;
      place-items: center;
      width: 48px;
      height: 48px;
      padding: 0;
      border: 0;
      background: transparent;
      color: var(--fg);
      cursor: pointer;
    }
  `,
})
export class ThemeToggle {
  protected readonly themes = inject(ThemeService);
  protected readonly label = computed(() =>
    this.themes.theme() === 'dark'
      ? $localize`:@@theme.toLight:Switch to light theme`
      : $localize`:@@theme.toDark:Switch to dark theme`,
  );
}
