import { ChangeDetectionStrategy, Component, computed, input, linkedSignal } from '@angular/core';
import type { CaseDiagramData } from './diagrams';

/**
 * Interactive stepped 8px-grid architecture diagram for case studies (issue #645).
 * Defaults to the built mode (`built: true`), switches in CSS steps without external dependencies,
 * and stays completely readable without JavaScript or motion.
 */
@Component({
  selector: 'app-case-diagram',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './case-diagram.html',
  styleUrl: './case-diagram.scss',
})
export class CaseDiagram {
  readonly diagram = input.required<CaseDiagramData>();

  protected readonly active = linkedSignal(() => {
    const idx = this.diagram().modes.findIndex((m) => m.built);
    return idx >= 0 ? idx : 0;
  });

  protected readonly current = computed(() => this.diagram().modes[this.active()] ?? this.diagram().modes[0]);
}
