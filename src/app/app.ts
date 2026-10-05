import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GameTrigger } from './game/game-trigger';
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
  imports: [RouterOutlet, Ambient, SiteIntro, PixelCursor, SiteHeader, SiteFooter, GameTrigger],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly ambient = [ambientEffect];
  protected readonly cursor = [cursorEffect, scrambleEffect];
  protected readonly intro = [introEffect];
}
