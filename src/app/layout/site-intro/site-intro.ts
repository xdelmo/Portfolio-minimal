import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CONTENT } from '../../content/content';
import { MotionHost } from '../../motion/motion-host';

/** First-visit overlay; only visible while <html> has the intro-on class set by the inline script in index.html. */
@Component({
  selector: 'app-site-intro',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: MotionHost, inputs: ['appMotion'] }],
  templateUrl: './site-intro.html',
  styleUrl: './site-intro.scss',
})
export class SiteIntro {
  protected readonly words = (() => {
    // one index across the words, so the letters light up in a single stagger
    let i = 0;
    return inject(CONTENT)
      .person.name.split(' ')
      .map((word) => Array.from(word, (char) => ({ char, i: i++ })));
  })();
  protected readonly pixels = Array.from({ length: 12 });
}
