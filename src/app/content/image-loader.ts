import { ImageLoaderConfig } from '@angular/common';

/** Smaller widths live next to the original as `name-<width>.<ext>`; the full width is the original file. */
export function workImageLoader({ src, width, loaderParams }: ImageLoaderConfig): string {
  const full = loaderParams?.['full'] as number | undefined;
  return width && full && width < full ? src.replace(/\.(\w+)$/, `-${String(width)}.$1`) : src;
}
