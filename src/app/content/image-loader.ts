import { ImageLoaderConfig } from '@angular/common';

/** Smaller widths live next to the original as `name-<width>.jpg`; the full width is the original file. */
export function workImageLoader({ src, width, loaderParams }: ImageLoaderConfig): string {
  const full = loaderParams?.['full'] as number | undefined;
  return width && full && width < full ? src.replace(/\.jpg$/, `-${String(width)}.jpg`) : src;
}

/** The 40px-wide copy shown, scaled up and pixelated, when a project card is hovered. */
export function pixelSrc(src: string): string {
  return src.replace(/\.jpg$/, '-40.jpg');
}
