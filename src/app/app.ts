import { ChangeDetectionStrategy, Component, Injector, afterNextRender, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { isNewPage } from './core/current-url';
import { GameTrigger } from './game/game-trigger';
import { BackToTop } from './layout/back-to-top';
import { Ambient } from './layout/ambient';
import { SiteFooter } from './layout/site-footer';
import { PixelCursor } from './layout/pixel-cursor';
import { SiteIntro } from './layout/site-intro';
import { ambientEffect } from './motion/effects/ambient';
import { cursorEffect } from './motion/effects/cursor';
import { introEffect } from './motion/effects/intro';
import { scrambleEffect } from './motion/effects/scramble';
import { SiteHeader } from './layout/site-header';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, Ambient, SiteIntro, PixelCursor, SiteHeader, SiteFooter, GameTrigger, BackToTop],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly ambient = [ambientEffect];
  protected readonly cursor = [cursorEffect, scrambleEffect];
  protected readonly intro = [introEffect];

  constructor() {
    // after the router opens another page, the focus moves to its main content (issue #181): the link that was pressed
    // is gone, so the focus would fall to <body> and a screen reader would announce nothing
    const injector = inject(Injector);
    const router = inject(Router);
    let from = '';
    router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => {
        const to = event.urlAfterRedirects;
        if (event.id > 1 && isNewPage(from, to)) {
          afterNextRender(() => document.getElementById('main')?.focus({ preventScroll: true }), { injector });
        }
        from = to;
      });
  }
}
