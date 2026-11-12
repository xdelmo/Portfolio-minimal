import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ExperienceItem } from '../../content/content.model';

@Component({
  selector: 'app-experience-timeline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './experience-timeline.html',
  styleUrl: './experience-timeline.scss',
})
export class ExperienceTimeline {
  readonly items = input.required<readonly ExperienceItem[]>();

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);
    const measure = (): void => {
      for (const li of host.querySelectorAll<HTMLElement>('.timeline > li')) {
        li.classList.toggle('sticks', parseFloat(getComputedStyle(li).top) + li.offsetHeight <= innerHeight);
      }
    };
    // browser only: the server prerenders the cards without measuring them (and has no window to listen to)
    afterNextRender(() => {
      measure();
      addEventListener('resize', measure);
      const sizes = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : undefined;
      for (const li of host.querySelectorAll('.timeline > li')) sizes?.observe(li);
      destroyRef.onDestroy(() => {
        sizes?.disconnect();
        removeEventListener('resize', measure);
      });
    });
  }
}
