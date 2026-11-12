import { DestroyRef, Directive, ElementRef, afterNextRender, inject, input } from '@angular/core';

/** Blocks across the photo at each step, one step every STEP_MS; after the last one the photo itself shows. */
export const STEPS = [8, 16, 32, 48, 96, 128] as const;
export const STEP_MS = 100;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Where `object-fit` draws an image of `iw` × `ih` inside a box of `bw` × `bh` (cover crops, contain letterboxes). */
export function fit(mode: string, bw: number, bh: number, iw: number, ih: number): Rect {
  if (mode !== 'cover' && mode !== 'contain') return { x: 0, y: 0, w: bw, h: bh };
  const scale = mode === 'cover' ? Math.max(bw / iw, bh / ih) : Math.min(bw / iw, bh / ih);
  const w = iw * scale;
  const h = ih * scale;
  return { x: (bw - w) / 2, y: (bh - h) / 2, w, h };
}

/** The canvas of one step: `cols` blocks across the box, square blocks, so as many rows as the box's shape asks. */
export function grid(cols: number, bw: number, bh: number): { cols: number; rows: number } {
  return { cols, rows: Math.max(1, Math.round((cols * bh) / bw)) };
}

export type RGB = readonly [number, number, number];

/** Bayer 4 × 4 ordered-dither thresholds, 0–15. */
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/** Relative luminance of an sRGB colour, 0–1 (Rec. 709 weights, no linearisation: enough to pick a side). */
export const luma = ([r, g, b]: RGB): number => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

/**
 * 1-bit ordered dither of an RGBA buffer `cols` pixels wide, in place (issue #420): every pixel becomes `dark` or `light`
 * by its luminance against the Bayer threshold of its cell.
 */
export function dither(data: Uint8ClampedArray, cols: number, dark: RGB, light: RGB): void {
  for (let i = 0; i < data.length; i += 4) {
    const p = i / 4;
    const t = (BAYER4[((Math.floor(p / cols) % 4) * 4) + (p % cols) % 4] + 0.5) / 16;
    const [r, g, b] = luma([data[i], data[i + 1], data[i + 2]]) < t ? dark : light;
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }
}

// the CSS a canvas over the photo copies from it, so its outline stays the same (the contact photo's pixel circle)
const MASK = ['mask-image', 'mask-size', 'mask-position', 'mask-repeat', '-webkit-mask-image', '-webkit-mask-size', '-webkit-mask-position', '-webkit-mask-repeat'];

/**
 * A photo that loads depixelating, as on locomotive.ca (issue #157): once 15% of the screen past its top edge, a canvas
 * over it draws it in 8, 16, 32, 48, 96 and 128 blocks across, one step every 100 ms, then the photo itself shows.
 * Nothing changes without JavaScript, with reduced motion, or for a photo already on screen when the page opens (it
 * would flash sharp, then pixelated). With `appDepixelate="dither"` (the project cards, issue #420) every step is a 1-bit
 * dither in the theme's ink and paper, and the colour photo fades in over the last one.
 */
@Directive({ selector: 'img[appDepixelate]' })
export class Depixelate {
  readonly appDepixelate = input('');

  constructor() {
    const img = inject<ElementRef<HTMLImageElement>>(ElementRef).nativeElement;
    let stop = (): void => undefined;
    afterNextRender(() => {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const box = img.getBoundingClientRect();
      if (box.top < innerHeight && box.bottom > 0) return;
      img.style.opacity = '0';
      const views = new IntersectionObserver(
        (entries) => {
          if (!entries.some((e) => e.isIntersecting)) return;
          views.disconnect();
          stop = depixelate(img, this.appDepixelate() === 'dither');
        },
        { rootMargin: '0px 0px -15% 0px' },
      );
      views.observe(img);
      stop = () => {
        views.disconnect();
        img.style.opacity = '';
      };
    });
    inject(DestroyRef).onDestroy(() => {
      stop();
    });
  }
}

/** Runs the steps on a canvas over `img`; returns what stops them and shows the photo. */
function depixelate(img: HTMLImageElement, dithered: boolean): () => void {
  const canvas = document.createElement('canvas');
  let timer = 0;
  let bitmap: ImageBitmap | undefined;
  let stopped = false;
  const done = (): void => {
    stopped = true;
    clearTimeout(timer);
    bitmap?.close();
    canvas.remove();
    img.style.opacity = '';
  };
  const ctx = canvas.getContext('2d', { willReadFrequently: dithered });
  if (!ctx) {
    done();
    return done;
  }
  const style = getComputedStyle(img);
  for (const property of MASK) canvas.style.setProperty(property, style.getPropertyValue(property));
  Object.assign(canvas.style, { position: 'absolute', imageRendering: 'pixelated', pointerEvents: 'none' });
  canvas.setAttribute('aria-hidden', 'true');

  // ink and paper, darker first whatever the theme, so a dark photo stays dark: resolved by painting each on the canvas
  const [dark, light] = (dithered ? (['--fg', '--surface'] as const) : [])
    .map((token): RGB => {
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue(token);
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      return [r, g, b];
    })
    .sort((a, b) => luma(a) - luma(b));

  const step = (from: ImageBitmap, i: number): void => {
    if (i === STEPS.length) {
      if (!dithered) {
        done();
        return;
      }
      // the colour photo shows under the last dithered step as it fades out
      img.style.opacity = '';
      canvas.animate({ opacity: [1, 0] }, { duration: 300, easing: 'ease-out' }).finished.then(done, done);
      return;
    }
    // measured at every step: the layout may move while the photo scrolls in
    const bw = img.offsetWidth;
    const bh = img.offsetHeight;
    Object.assign(canvas.style, { left: `${String(img.offsetLeft)}px`, top: `${String(img.offsetTop)}px`, width: `${String(bw)}px`, height: `${String(bh)}px` });
    const { cols, rows } = grid(STEPS[i], bw, bh);
    canvas.width = cols;
    canvas.height = rows;
    const r = fit(style.objectFit, bw, bh, img.naturalWidth, img.naturalHeight);
    const s = cols / bw;
    ctx.drawImage(from, r.x * s, r.y * s, r.w * s, r.h * s);
    if (dithered) {
      const pixels = ctx.getImageData(0, 0, cols, rows);
      dither(pixels.data, cols, dark, light);
      ctx.putImageData(pixels, 0, 0);
    }
    timer = window.setTimeout(() => {
      step(from, i + 1);
    }, STEP_MS);
  };
  const start = (): void => {
    if (!img.naturalWidth) {
      done();
      return;
    }
    // drawing the <img> itself decoded the whole JPEG on the main thread at every step, 16 ms each, and a bitmap made
    // from the <img> decodes it there too (issue #207): only a bitmap made from the file decodes off the main thread.
    // The file is the one the photo loaded, from the HTTP cache; small, since the finest step is 128 blocks across
    fetch(img.currentSrc)
      .then((response) => response.blob())
      .then((file) => createImageBitmap(file, { resizeWidth: Math.min(img.naturalWidth, 512), resizeQuality: 'medium' }))
      .then(
        (decoded) => {
          if (stopped) {
            decoded.close();
            return;
          }
          bitmap = decoded;
          img.after(canvas);
          step(decoded, 0);
        },
        done,
      );
  };
  if (img.complete) start();
  else {
    img.addEventListener('load', start, { once: true });
    img.addEventListener('error', done, { once: true });
  }
  return done;
}
