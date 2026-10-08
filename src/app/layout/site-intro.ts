import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CONTENT } from '../content/content';
import { MotionHost } from '../motion/motion-host';

/** First-visit overlay; only visible while <html> has the intro-on class set by the inline script in index.html. */
@Component({
  selector: 'app-site-intro',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: MotionHost, inputs: ['appMotion'] }],
  template: `
    <div class="site-intro" aria-hidden="true">
      <p class="name">
        @for (char of letters; track $index) {
          <span class="letter">{{ char }}</span>
        }
      </p>
      <p class="pixels">
        @for (px of pixels; track $index) {
          <span class="px"></span>
        }
      </p>
    </div>
  `,
  styles: `
    .site-intro {
      display: none;
    }
    :host-context(.intro-on) .site-intro {
      position: fixed;
      inset: 0;
      z-index: 100;
      display: grid;
      place-content: center;
      gap: var(--space-4);
      padding: var(--space-4);
      background: var(--intro-bg);
      color: var(--intro-fg);
      pointer-events: none;
      // lifts the panel even if the motion script never arrives
      animation: intro-out 0.6s 3s cubic-bezier(0.7, 0, 0.3, 1) forwards;
    }
    .name {
      margin: 0;
      font-size: clamp(2.5rem, 1rem + 6vw, 6rem);
      font-weight: 700;
      line-height: 1;
      letter-spacing: -0.03em;
      text-align: center;
    }
    .letter {
      opacity: 0.18;
      white-space: pre;
    }
    .pixels {
      display: flex;
      justify-content: center;
      gap: 4px;
      margin: 0;
    }
    .px {
      width: 12px;
      height: 12px;
      background: currentColor;
      opacity: 0.9;
    }
    @keyframes intro-out {
      to {
        transform: translateY(-100%);
        visibility: hidden;
      }
    }
  `,
})
export class SiteIntro {
  protected readonly letters = Array.from(inject(CONTENT).person.name);
  protected readonly pixels = Array.from({ length: 12 });
}
