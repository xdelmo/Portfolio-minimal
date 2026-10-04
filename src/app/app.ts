import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SiteFooter } from './layout/site-footer';
import { ScrollProgress } from './layout/scroll-progress';
import { SiteIntro } from './layout/site-intro';
import { introEffect } from './motion/effects/intro';
import { progressEffect } from './motion/effects/progress';
import { SiteHeader } from './layout/site-header';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, SiteIntro, ScrollProgress, SiteHeader, SiteFooter],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly intro = [introEffect];
  protected readonly progress = [progressEffect];
}
