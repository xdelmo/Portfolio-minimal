import { ChangeDetectionStrategy, Component, input } from '@angular/core';

// the favicon's frontal moai (public/favicon.svg, issue #323), one character per 16 × 16 cell
const SPRITE = [
  '....aaaaaaa.....',
  '....aaaaaaa.....',
  '....aaaaaaa.....',
  '....bcccccc.....',
  '...cccbbcbbc....',
  '...cbbbbbbbc....',
  '..dcbbbbbbbcd...',
  '..dccccbccccd...',
  '..dceecbbeecd...',
  '..dcfecbcfecd...',
  '..dccccbcccbd...',
  '..dccccbccccd...',
  '..dccccbccccd...',
  '..dcccbbbcccd...',
  '...cccccccbc....',
  '...ccdddddcc....',
];

// tokens, so the moai follows the theme like the 3D one (pukao in peach as on the favicon)
const FILL: Record<string, string> = {
  a: 'var(--px-6)',
  b: 'var(--stone-light)',
  c: 'var(--stone)',
  d: 'var(--stone-dark)',
  e: 'var(--moai-eye-white)',
  f: 'var(--accent)',
};

const PATHS = Object.entries(FILL).map(([key, fill]) => ({
  fill,
  d: SPRITE.map((row, y) => row.replace(/./g, (cell: string, x: number) => (cell === key ? `M${String(x)} ${String(y)}h1v1h-1z` : ''))).join(''),
}));

/**
 * A word of the hero lede with the pixel moai hidden behind it: on hover the moai peeks out over the word in 8px
 * steps and sinks back when the pointer leaves (issue #394). Desktop pointers only, nothing with reduced motion;
 * the moai is decoration, so the word reads as plain text.
 */
@Component({
  selector: 'app-moai-peek',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `{{ word() }}<span class="window"
      ><svg viewBox="0 0 16 16" width="32" height="32" shape-rendering="crispEdges" aria-hidden="true" focusable="false">
        @for (path of paths; track path.fill) {
          <path [attr.d]="path.d" [style.fill]="path.fill" />
        }
      </svg></span
    >`,
  styles: `
    :host {
      position: relative;
    }
    .window {
      display: none;
      position: absolute;
      z-index: -1;
      left: 50%;
      bottom: 0.75em;
      width: 32px;
      height: 32px;
      translate: -50% 0;
      overflow: hidden;
      pointer-events: none;
    }
    svg {
      display: block;
      translate: 0 100%;
      transition: translate 240ms steps(3);
    }
    @media (min-width: 1024px) and (hover: hover) and (prefers-reduced-motion: no-preference) {
      .window {
        display: block;
      }
      :host(:hover) svg {
        translate: 0 25%;
      }
    }
  `,
})
export class MoaiPeek {
  readonly word = input.required<string>();
  protected readonly paths = PATHS;
}
