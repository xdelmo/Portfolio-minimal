import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CONTENT } from '../content/content';

/** The step towards contact at the end of a case study or a post, where a reader has just seen the work (issue #229). */
@Component({
  selector: 'app-contact-prompt',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="lead" i18n="@@contactPrompt.lead">Hiring for a frontend role?</p>
    <a class="button button--primary" [href]="content.person.linkedin" target="_blank" rel="me noopener" aria-describedby="new-tab" i18n="@@contactPrompt.cta">Message on LinkedIn</a>
  `,
  styles: `
    :host {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-2) var(--space-3);
    }
    .lead {
      margin: 0;
      font-size: var(--step-1);
      font-weight: 600;
    }
  `,
})
export class ContactPrompt {
  protected readonly content = inject(CONTENT);
}
