import { IMAGE_LOADER } from '@angular/common';
import { Provider, EnvironmentProviders } from '@angular/core';
import { provideRouter } from '@angular/router';
import { CONTENT } from '../app/content/content';
import { CONTENT_EN } from '../app/content/content.en';
import { SiteContent } from '../app/content/content.model';
import { workImageLoader } from '../app/content/image-loader';

/** What a page or section needs in a TestBed: a router, the work images' loader (as in `app.config.ts`) and the content, English unless given. */
export function testProviders(content: SiteContent = CONTENT_EN): (Provider | EnvironmentProviders)[] {
  return [provideRouter([]), { provide: IMAGE_LOADER, useValue: workImageLoader }, { provide: CONTENT, useValue: content }];
}
