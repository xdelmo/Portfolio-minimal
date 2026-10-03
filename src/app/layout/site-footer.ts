import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CONTENT } from '../content/content';

@Component({
  selector: 'app-site-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="site-footer container">
      <p>{{ content.person.name }}, {{ content.person.location }}</p>
      <ul>
        <li><a [href]="'mailto:' + content.person.email">{{ content.person.email }}</a></li>
        <li><a [href]="content.person.linkedin" rel="me">LinkedIn</a></li>
        <li><a [href]="content.person.github" rel="me">GitHub</a></li>
      </ul>
    </footer>
  `,
  styles: `
    .site-footer {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: var(--space-2);
      padding-block: var(--space-6);
      border-top: 1px solid var(--rule);
      color: var(--fg-muted);
      font-size: var(--step--1);
    }
    ul {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-3);
      margin: 0;
      padding: 0;
      list-style: none;
    }
    a {
      display: inline-block;
      min-height: 24px;
    }
  `,
})
export class SiteFooter {
  protected readonly content = inject(CONTENT);
}
