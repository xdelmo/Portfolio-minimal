import { DestroyRef, Directive, ElementRef, afterNextRender, inject } from '@angular/core';
import { STEPS, STEP_MS, fit, grid } from './depixelate';

// the CSS a canvas over the photo copies from it, so its outline stays the same (the contact photo's pixel circle)
const MASK = ['mask-image', 'mask-size', 'mask-position', 'mask-repeat', '-webkit-mask-image', '-webkit-mask-size', '-webkit-mask-position', '-webkit-mask-repeat'];

/**
 * A photo that loads depixelating, as on locomotive.ca (issue #157): once 15% of the screen past its top edge, a canvas
 * over it draws it in 8, 16, 32, 48, 96 and 128 blocks across, one step every 100 ms, then the photo itself shows.
 * Nothing changes without JavaScript, with reduced motion, or for a photo already on screen when the page opens (it
 * would flash sharp, then pixelated).
 */
@Directive({ selector: 'img[appDepixelate]' })
export class Depixelate {
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
          stop = depixelate(img);
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
function depixelate(img: HTMLImageElement): () => void {
  const canvas = document.createElement('canvas');
  let timer = 0;
  const done = (): void => {
    clearTimeout(timer);
    canvas.remove();
    img.style.opacity = '';
  };
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    done();
    return done;
  }
  const style = getComputedStyle(img);
  for (const property of MASK) canvas.style.setProperty(property, style.getPropertyValue(property));
  Object.assign(canvas.style, { position: 'absolute', imageRendering: 'pixelated', pointerEvents: 'none' });
  canvas.setAttribute('aria-hidden', 'true');

  const step = (i: number): void => {
    if (i === STEPS.length) {
      done();
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
    ctx.drawImage(img, r.x * s, r.y * s, r.w * s, r.h * s);
    timer = window.setTimeout(() => {
      step(i + 1);
    }, STEP_MS);
  };
  const start = (): void => {
    if (!img.naturalWidth) {
      done();
      return;
    }
    img.after(canvas);
    step(0);
  };
  if (img.complete) start();
  else {
    img.addEventListener('load', start, { once: true });
    img.addEventListener('error', done, { once: true });
  }
  return done;
}
