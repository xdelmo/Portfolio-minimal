import { ChangeDetectionStrategy, Component, DOCUMENT, computed, inject } from '@angular/core';
import { ThemeService } from './theme.service';

@Component({
  selector: 'app-theme-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" class="theme-toggle" (click)="switchTheme($event)" [attr.aria-label]="label()">
      <svg [class]="themes.theme() === 'dark' ? 'sun' : 'moon'" viewBox="0 0 8 8" width="24" height="24" shape-rendering="crispEdges" aria-hidden="true">
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
    /* on hover the sun turns its rays, the moon rocks */
    svg {
      transition: transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .theme-toggle:hover .sun,
    .theme-toggle:focus-visible .sun {
      transform: rotate(90deg) scale(1.15);
    }
    .theme-toggle:hover .moon,
    .theme-toggle:focus-visible .moon {
      transform: rotate(-25deg) scale(1.15);
    }
    @media (prefers-reduced-motion: reduce) {
      svg {
        transition: none;
      }
    }
  `,
})
export class ThemeToggle {
  protected readonly themes = inject(ThemeService);
  private readonly doc = inject(DOCUMENT);
  protected readonly label = computed(() =>
    this.themes.theme() === 'dark'
      ? $localize`:@@theme.toLight:Switch to light theme`
      : $localize`:@@theme.toDark:Switch to dark theme`,
  );

  /**
   * The new theme grows as a circle from the toggle over the whole viewport; from light to dark it is the other way
   * round, the light page closes into the toggle (issue #116). CSS in _base.scss.
   */
  protected switchTheme(event: MouseEvent): void {
    const view = this.doc.defaultView;
    if (!view || !('startViewTransition' in this.doc) || view.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.themes.toggle();
      return;
    }
    const box = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = box.left + box.width / 2;
    const y = box.top + box.height / 2;
    const root = this.doc.documentElement;
    root.style.setProperty('--reveal-x', `${String(x)}px`);
    root.style.setProperty('--reveal-y', `${String(y)}px`);
    root.style.setProperty('--reveal-r', `${String(Math.hypot(Math.max(x, view.innerWidth - x), Math.max(y, view.innerHeight - y)))}px`);
    root.classList.add('theme-switching');
    root.classList.toggle('theme-to-dark', this.themes.theme() === 'light');
    const transition = this.doc.startViewTransition(() => {
      this.themes.toggle();
    });
    void transition.finished.finally(() => {
      root.classList.remove('theme-switching', 'theme-to-dark');
    });
  }
}
